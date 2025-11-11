'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserStats, UserEquippedTitle, Title } from '@/lib/types';
import { getRarityGradient } from '@/utils/titleSystem';

const USER_ID = '00000000-0000-0000-0000-000000000000';

export default function PlayerCard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [equippedTitle, setEquippedTitle] = useState<Title | null>(null);
  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [totalTitles, setTotalTitles] = useState(0);
  const [earnedTitles, setEarnedTitles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, []);

  async function fetchPlayerData() {
    try {
      // ユーザー統計を取得
      let { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', USER_ID)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      // なければ作成
      if (!userStats) {
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({
            user_id: USER_ID,
            total_xp: 0,
            current_level: 1,
            streak_days: 0,
            gear_points: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        userStats = newStats;
      }

      setStats(userStats);

      // 装備中の称号を取得
      const { data: equipped } = await supabase
        .from('user_equipped_title')
        .select(`
          *,
          title:titles(*)
        `)
        .eq('user_id', USER_ID)
        .single();

      if (equipped?.title) {
        setEquippedTitle(equipped.title);
      } else {
        // デフォルト称号「初心者」を装備
        const { data: defaultTitle } = await supabase
          .from('titles')
          .select('*')
          .eq('name', '初心者')
          .single();

        if (defaultTitle) {
          await supabase
            .from('user_equipped_title')
            .upsert({
              user_id: USER_ID,
              title_id: defaultTitle.id,
            });
          setEquippedTitle(defaultTitle);
        }
      }

      // 累計学習時間を計算
      const { data: records } = await supabase
        .from('study_records')
        .select('study_minutes')
        .eq('user_id', USER_ID);

      const totalMinutes = records?.reduce((sum, r) => sum + (r.study_minutes || 0), 0) || 0;
      setTotalStudyHours(Math.floor(totalMinutes / 60));

      // 称号数を取得
      const { count: totalCount } = await supabase
        .from('titles')
        .select('*', { count: 'exact', head: true });

      const { count: earnedCount } = await supabase
        .from('user_titles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', USER_ID);

      setTotalTitles(totalCount || 0);
      setEarnedTitles(earnedCount || 0);

    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatStudyTime(hours: number): string {
    if (hours >= 100) {
      return `${hours}時間`;
    }
    return `${hours}時間`;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  const titleGradient = equippedTitle ? getRarityGradient(equippedTitle.rarity) : 'from-gray-400 to-gray-600';

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {/* ヘッダー - 称号表示 */}
      <div className={`bg-linear-to-r ${titleGradient} p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-4">
            <div className="text-sm opacity-90 mb-2">称号</div>
            <h2 className="text-4xl font-black tracking-wide">
              {equippedTitle?.name || '初心者'}
            </h2>
            <p className="text-sm opacity-90 mt-2">
              {equippedTitle?.description || 'はじめての称号'}
            </p>
          </div>
        </div>
      </div>

      {/* メインステータス */}
      <div className="p-8">
        {/* レベルとXP */}
        <div className="mb-8 text-center">
          <div className="text-sm text-gray-600 mb-2">総合レベル</div>
          <div className="text-6xl font-black text-indigo-600 mb-2">
            {stats?.current_level || 1}
          </div>
          <div className="text-sm text-gray-500">
            {(stats?.total_xp || 0).toLocaleString()} XP
          </div>
        </div>

        {/* 統計情報グリッド */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 累計学習時間 */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⏰</div>
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {formatStudyTime(totalStudyHours)}
            </div>
            <div className="text-sm text-gray-600">累計学習時間</div>
          </div>

          {/* ストリーク */}
          <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats?.streak_days || 0}日
            </div>
            <div className="text-sm text-gray-600">連続学習</div>
          </div>

          {/* 称号コレクション */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {earnedTitles} / {totalTitles}
            </div>
            <div className="text-sm text-gray-600">称号獲得</div>
          </div>

          {/* ギアポイント */}
          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats?.gear_points || 0}
            </div>
            <div className="text-sm text-gray-600">ギアポイント</div>
          </div>
        </div>

        {/* 称号変更ボタン */}
        <div className="mt-6">
          <a href="/titles">
            <button className="w-full bg-linear-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-600 hover:to-purple-700 transition-all">
              称号を変更する
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}