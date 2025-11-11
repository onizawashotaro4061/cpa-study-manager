'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Title, UserTitle } from '@/lib/types';
import { getRarityColor, getRarityGradient, equipTitle } from '@/utils/titleSystem';

const USER_ID = '00000000-0000-0000-0000-000000000000';

export default function TitleList() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [earnedTitleIds, setEarnedTitleIds] = useState<Set<string>>(new Set());
  const [equippedTitleId, setEquippedTitleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    fetchTitles();
  }, []);

  async function fetchTitles() {
    try {
      // 全称号を取得
      const { data: allTitles, error: titlesError } = await supabase
        .from('titles')
        .select('*')
        .order('rarity', { ascending: false });

      if (titlesError) throw titlesError;
      setTitles(allTitles || []);

      // 獲得済み称号を取得
      const { data: userTitles, error: userTitlesError } = await supabase
        .from('user_titles')
        .select('title_id')
        .eq('user_id', USER_ID);

      if (userTitlesError) throw userTitlesError;
      setEarnedTitleIds(new Set(userTitles?.map(ut => ut.title_id) || []));

      // 装備中の称号を取得
      const { data: equipped } = await supabase
        .from('user_equipped_title')
        .select('title_id')
        .eq('user_id', USER_ID)
        .single();

      setEquippedTitleId(equipped?.title_id || null);

    } catch (error) {
      console.error('Error fetching titles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEquipTitle(titleId: string) {
    if (!earnedTitleIds.has(titleId)) {
      alert('まだ獲得していない称号です');
      return;
    }

    const success = await equipTitle(titleId);
    if (success) {
      setEquippedTitleId(titleId);
      alert('称号を装備しました!');
    } else {
      alert('装備に失敗しました');
    }
  }

  const filteredTitles = titles.filter(title => {
    const isEarned = earnedTitleIds.has(title.id);
    if (selectedCategory === 'earned') return isEarned;
    if (selectedCategory === 'locked') return !isEarned;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* カテゴリー選択 */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          すべて ({titles.length})
        </button>
        <button
          onClick={() => setSelectedCategory('earned')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedCategory === 'earned'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          獲得済み ({earnedTitleIds.size})
        </button>
        <button
          onClick={() => setSelectedCategory('locked')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedCategory === 'locked'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          未獲得 ({titles.length - earnedTitleIds.size})
        </button>
      </div>

      {/* 称号グリッド */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTitles.map((title) => {
          const isEarned = earnedTitleIds.has(title.id);
          const isEquipped = equippedTitleId === title.id;
          const gradient = getRarityGradient(title.rarity);

          return (
            <div
              key={title.id}
              className={`rounded-xl overflow-hidden transition-all ${
                isEarned
                  ? 'shadow-lg hover:shadow-xl cursor-pointer'
                  : 'opacity-50 grayscale'
              } ${isEquipped ? 'ring-4 ring-indigo-500' : ''}`}
              onClick={() => isEarned && handleEquipTitle(title.id)}
            >
              <div className={`bg-linear-to-r ${gradient} p-6 text-white relative`}>
                {isEquipped && (
                  <div className="absolute top-2 right-2 bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                    装備中
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-black mb-2">
                    {isEarned ? title.name : '???'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {isEarned ? title.description : '???'}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {title.rarity === 'common' && '⚪ コモン'}
                    {title.rarity === 'rare' && '🔵 レア'}
                    {title.rarity === 'epic' && '🟣 エピック'}
                    {title.rarity === 'legendary' && '🟡 レジェンド'}
                  </span>
                  <span className="text-green-600 font-semibold">
                    +{title.gear_points} GP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTitles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">称号がありません</p>
        </div>
      )}
    </div>
  );
}