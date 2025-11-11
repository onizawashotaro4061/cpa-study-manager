import { supabase } from '@/lib/supabase';
import { TitleRarity } from '@/lib/types';

const USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * 称号獲得チェック
 */
export async function checkAndAwardTitles(): Promise<string[]> {
  try {
    // 全称号を取得
    const { data: allTitles } = await supabase
      .from('titles')
      .select('*');

    if (!allTitles) return [];

    // 既に獲得済みの称号を取得
    const { data: userTitles } = await supabase
      .from('user_titles')
      .select('title_id')
      .eq('user_id', USER_ID);

    const earnedTitleIds = new Set(userTitles?.map(ut => ut.title_id) || []);

    // 新しく獲得できる称号をチェック
    const newTitleIds: string[] = [];

    for (const title of allTitles) {
      if (earnedTitleIds.has(title.id)) continue;

      const shouldAward = await checkTitleRequirement(title);

      if (shouldAward) {
        newTitleIds.push(title.id);

        // ギアポイントを付与
        const { data: stats } = await supabase
          .from('user_stats')
          .select('gear_points')
          .eq('user_id', USER_ID)
          .single();

        if (stats) {
          await supabase
            .from('user_stats')
            .update({
              gear_points: stats.gear_points + title.gear_points,
            })
            .eq('user_id', USER_ID);
        }
      }
    }

    // 新しい称号を付与
    if (newTitleIds.length > 0) {
      await supabase
        .from('user_titles')
        .insert(
          newTitleIds.map(titleId => ({
            user_id: USER_ID,
            title_id: titleId,
          }))
        );
    }

    return newTitleIds;
  } catch (error) {
    console.error('Error checking titles:', error);
    return [];
  }
}

/**
 * 称号の獲得条件をチェック
 */
async function checkTitleRequirement(title: any): Promise<boolean> {
  try {
    switch (title.requirement_type) {
      case 'default':
        return true;

      case 'rank': {
        if (!title.requirement_subject_id || !title.requirement_rank) return false;

        const { data: mastery } = await supabase
          .from('subject_mastery')
          .select('rank')
          .eq('user_id', USER_ID)
          .eq('subject_id', title.requirement_subject_id)
          .single();

        if (!mastery) return false;

        const rankValues: { [key: string]: number } = {
          'C': 1, 'B': 2, 'A': 3, 'S': 4
        };

        const currentRankValue = rankValues[mastery.rank.charAt(0)] || 0;
        const requiredRankValue = rankValues[title.requirement_rank] || 0;

        return currentRankValue >= requiredRankValue;
      }

      case 'streak': {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('streak_days')
          .eq('user_id', USER_ID)
          .single();

        return (stats?.streak_days || 0) >= (title.requirement_value || 0);
      }

      case 'total_hours': {
        const { data: records } = await supabase
          .from('study_records')
          .select('study_minutes')
          .eq('user_id', USER_ID);

        const totalMinutes = records?.reduce((sum, r) => sum + (r.study_minutes || 0), 0) || 0;
        return totalMinutes >= (title.requirement_value || 0);
      }

      case 'all_subjects': {
        const { data: masteries } = await supabase
          .from('subject_mastery')
          .select('rank')
          .eq('user_id', USER_ID);

        if (!masteries) return false;

        const { data: subjects } = await supabase
          .from('subjects')
          .select('id');

        if (!subjects || masteries.length < subjects.length) return false;

        const rankValues: { [key: string]: number } = {
          'C-': 0, 'C': 1, 'C+': 1,
          'B-': 2, 'B': 2, 'B+': 2,
          'A-': 3, 'A': 3, 'A+': 3,
          'S': 4
        };

        const requiredRankValue = title.requirement_value || 0;
        return masteries.every(m => {
          const rankValue = rankValues[m.rank] || 0;
          return rankValue >= requiredRankValue;
        });
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking title requirement:', error);
    return false;
  }
}

/**
 * レアリティの色を取得
 */
export function getRarityColor(rarity: TitleRarity): string {
  switch (rarity) {
    case 'common':
      return '#9CA3AF'; // グレー
    case 'rare':
      return '#3B82F6'; // 青
    case 'epic':
      return '#A855F7'; // 紫
    case 'legendary':
      return '#EAB308'; // 金
    default:
      return '#9CA3AF';
  }
}

/**
 * レアリティのグラデーションを取得
 */
export function getRarityGradient(rarity: TitleRarity): string {
  switch (rarity) {
    case 'common':
      return 'from-gray-400 to-gray-600';
    case 'rare':
      return 'from-blue-400 to-blue-600';
    case 'epic':
      return 'from-purple-400 to-purple-600';
    case 'legendary':
      return 'from-yellow-400 to-orange-500';
    default:
      return 'from-gray-400 to-gray-600';
  }
}

/**
 * 称号を装備
 */
export async function equipTitle(titleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_equipped_title')
      .upsert({
        user_id: USER_ID,
        title_id: titleId,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (error) {
    console.error('Error equipping title:', error);
    return false;
  }
}