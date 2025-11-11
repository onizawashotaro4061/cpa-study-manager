'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SubjectProgress, ExamType } from '@/lib/types';
import SubjectCard from './SubjectCard';

interface DashboardProps {
  examType: ExamType;
  title: string;
}

export default function Dashboard({ examType, title }: DashboardProps) {
  const [subjectProgresses, setSubjectProgresses] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [examType]);

  async function fetchProgress() {
    try {
      // 科目を取得
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('exam_type', examType)
        .order('order_index');

      if (subjectsError) throw subjectsError;
      if (!subjects) return;

      // 各科目の進捗を計算
      const progresses: SubjectProgress[] = await Promise.all(
        subjects.map(async (subject) => {
          // 論点数を取得
          const { count: totalTopics } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', await getChapterIds(subject.id));

          // 学習済み論点数を取得
          const { count: studiedTopics } = await supabase
            .from('study_records')
            .select('*', { count: 'exact', head: true })
            .eq('record_type', 'topic')
            .in('topic_id', await getTopicIds(subject.id));

          // 答練数を取得
          const { count: totalPracticeExams } = await supabase
            .from('practice_exams')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          // 完了答練数を取得
          const { count: completedPracticeExams } = await supabase
            .from('study_records')
            .select('*', { count: 'exact', head: true })
            .eq('record_type', 'practice_exam')
            .in('practice_exam_id', await getPracticeExamIds(subject.id));

          const total = (totalTopics || 0) + (totalPracticeExams || 0);
          const completed = (studiedTopics || 0) + (completedPracticeExams || 0);
          const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            subject,
            totalTopics: totalTopics || 0,
            studiedTopics: studiedTopics || 0,
            totalPracticeExams: totalPracticeExams || 0,
            completedPracticeExams: completedPracticeExams || 0,
            progressPercentage,
          };
        })
      );

      setSubjectProgresses(progresses);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getChapterIds(subjectId: string): Promise<string[]> {
    const { data } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subjectId);
    return data?.map(c => c.id) || [];
  }

  async function getTopicIds(subjectId: string): Promise<string[]> {
    const chapterIds = await getChapterIds(subjectId);
    if (chapterIds.length === 0) return [];
    
    const { data } = await supabase
      .from('topics')
      .select('id')
      .in('chapter_id', chapterIds);
    return data?.map(t => t.id) || [];
  }

  async function getPracticeExamIds(subjectId: string): Promise<string[]> {
    const { data } = await supabase
      .from('practice_exams')
      .select('id')
      .eq('subject_id', subjectId);
    return data?.map(p => p.id) || [];
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">科目ごとの学習進捗を確認できます</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectProgresses.map((progress) => (
            <SubjectCard
              key={progress.subject.id}
              subjectProgress={progress}
              examType={examType}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}