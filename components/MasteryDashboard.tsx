'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SubjectMasteryWithSubject, Subject } from '@/lib/types';
import SubjectMasteryCard from './SubjectMasteryCard';

interface MasteryDashboardProps {
  examType: 'tantoushiki' | 'ronbunshiki';
}

export default function MasteryDashboard({ examType }: MasteryDashboardProps) {
  const [masteries, setMasteries] = useState<SubjectMasteryWithSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasteries();
  }, [examType]);

  async function fetchMasteries() {
    try {
      const userId = '00000000-0000-0000-0000-000000000000'; // 仮のユーザーID

      // 科目を取得
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('exam_type', examType)
        .order('order_index');

      if (subjectsError) throw subjectsError;

      // 各科目の熟練度を取得または作成
      const masteriesData: SubjectMasteryWithSubject[] = await Promise.all(
        (subjects || []).map(async (subject: Subject) => {
          // 既存の熟練度を取得
          let { data: mastery, error: masteryError } = await supabase
            .from('subject_mastery')
            .select('*')
            .eq('user_id', userId)
            .eq('subject_id', subject.id)
            .single();

          // なければ作成
          if (!mastery) {
            const { data: newMastery, error: createError } = await supabase
              .from('subject_mastery')
              .insert({
                user_id: userId,
                subject_id: subject.id,
                current_xp: 0,
                rank: 'C-',
              })
              .select()
              .single();

            if (createError) throw createError;
            mastery = newMastery;
          }

          return {
            ...mastery,
            subject,
          };
        })
      );

      setMasteries(masteriesData);
    } catch (error) {
      console.error('Error fetching masteries:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {masteries.map((mastery) => (
        <SubjectMasteryCard key={mastery.id} mastery={mastery} />
      ))}
    </div>
  );
}