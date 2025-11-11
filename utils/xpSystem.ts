import { supabase } from '@/lib/supabase';
import { calculateXP, calculateRank } from './rankSystem';

const USER_ID = '00000000-0000-0000-0000-000000000000'; // 仮のユーザーID

/**
 * 学習記録時にXPを付与してランクを更新
 */
export async function awardXP(
  subjectId: string,
  type: 'topic' | 'practice_exam' | 'review',
  studyMinutes: number
): Promise<{ success: boolean; xpGained: number; newRank: string; leveledUp: boolean }> {
  try {
    // ストリーク状態を確認
    const hasStreak = await checkStreak();

    // XPを計算
    const xpGained = calculateXP(type, studyMinutes, hasStreak);

    // 科目熟練度を取得または作成
    let { data: mastery, error: masteryError } = await supabase
      .from('subject_mastery')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('subject_id', subjectId)
      .single();

    if (masteryError && masteryError.code !== 'PGRST116') {
      throw masteryError;
    }

    if (!mastery) {
      // 熟練度データを作成
      const { data: newMastery, error: createError } = await supabase
        .from('subject_mastery')
        .insert({
          user_id: USER_ID,
          subject_id: subjectId,
          current_xp: 0,
          rank: 'C-',
        })
        .select()
        .single();

      if (createError) throw createError;
      mastery = newMastery;
    }

    // 新しいXPとランクを計算
    const oldRank = mastery.rank;
    const newXP = mastery.current_xp + xpGained;
    const newRank = calculateRank(newXP);
    const leveledUp = oldRank !== newRank;

    // 熟練度を更新
    const { error: updateError } = await supabase
      .from('subject_mastery')
      .update({
        current_xp: newXP,
        rank: newRank,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mastery.id);

    if (updateError) throw updateError;

    // ユーザー統計を更新
    await updateUserStats(xpGained);

    // バッジチェック
    await checkAndAwardBadges();

    return {
      success: true,
      xpGained,
      newRank,
      leveledUp,
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return {
      success: false,
      xpGained: 0,
      newRank: 'C-',
      leveledUp: false,
    };
  }
}

/**
 * ストリーク状態を確認
 */
async function checkStreak(): Promise<boolean> {
  try {
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (error || !stats) return false;

    return stats.streak_days > 0;
  } catch (error) {
    return false;
  }
}

/**
 * ユーザー統計を更新
 */
async function updateUserStats(xpGained: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // ユーザー統計を取得または作成
    let { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    if (!stats) {
      // 新規作成
      const { error: createError } = await supabase
        .from('user_stats')
        .insert({
          user_id: USER_ID,
          total_xp: xpGained,
          current_level: 1,
          streak_days: 1,
          last_study_date: today,
          gear_points: 0,
        });

      if (createError) throw createError;
      return;
    }

    // ストリークを更新
    let newStreakDays = stats.streak_days;
    const lastStudyDate = stats.last_study_date;

    if (lastStudyDate) {
      const lastDate = new Date(lastStudyDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // 連続している
        newStreakDays += 1;
      } else if (diffDays > 1) {
        // 途切れた
        newStreakDays = 1;
      }
      // diffDays === 0 の場合は同じ日なので変更なし
    } else {
      newStreakDays = 1;
    }

    // 統計を更新
    const newTotalXP = stats.total_xp + xpGained;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000XPごとにレベルアップ

    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        streak_days: newStreakDays,
        last_study_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', USER_ID);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

/**
 * バッジ獲得チェック
 */
async function checkAndAwardBadges(): Promise<void> {
  try {
    // ユーザー統計を取得
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (!stats) return;

    // 全バッジを取得
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    if (!allBadges) return;

    // 既に獲得済みのバッジを取得
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', USER_ID);

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    // 新しく獲得できるバッジをチェック
    const newBadges: string[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      switch (badge.requirement_type) {
        case 'streak':
          shouldAward = stats.streak_days >= badge.requirement_value;
          break;
        case 'total_hours':
          // total_hoursは分単位で保存されているため、study_recordsから計算
          const { data: records } = await supabase
            .from('study_records')
            .select('study_minutes')
            .eq('user_id', USER_ID);
          
          const totalMinutes = records?.reduce((sum, r) => sum + (r.study_minutes || 0), 0) || 0;
          shouldAward = totalMinutes >= badge.requirement_value;
          break;
        case 'rank':
          // いずれかの科目で指定ランク以上に到達
          const { data: masteries } = await supabase
            .from('subject_mastery')
            .select('rank')
            .eq('user_id', USER_ID);
          
          const rankValues: { [key: string]: number } = {
            'C-': 0, 'C': 1, 'C+': 2,
            'B-': 3, 'B': 4, 'B+': 5,
            'A-': 6, 'A': 7, 'A+': 8,
            'S': 9, 'S+0': 10, 'S+1': 11, 'S+2': 12, 'S+3': 13,
            'S+4': 14, 'S+5': 15, 'S+6': 16, 'S+7': 17, 'S+8': 18, 'S+9': 19
          };
          
          const highestRank = masteries?.reduce((max, m) => {
            const rankValue = rankValues[m.rank] || 0;
            return rankValue > max ? rankValue : max;
          }, 0) || 0;
          
          shouldAward = highestRank >= badge.requirement_value;
          break;
      }

      if (shouldAward) {
        newBadges.push(badge.id);
        
        // ギアポイントを付与
        await supabase
          .from('user_stats')
          .update({
            gear_points: stats.gear_points + badge.gear_points,
          })
          .eq('user_id', USER_ID);
      }
    }

    // 新しいバッジを付与
    if (newBadges.length > 0) {
      await supabase
        .from('user_badges')
        .insert(
          newBadges.map(badgeId => ({
            user_id: USER_ID,
            badge_id: badgeId,
          }))
        );
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}