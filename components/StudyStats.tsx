'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SubjectStudyTime, DailyStudyTime } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function StudyStats() {
  const [subjectStats, setSubjectStats] = useState<SubjectStudyTime[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStudyTime[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  async function fetchStats() {
    try {
      const today = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate.setDate(today.getDate() - 30);
      }

      // 期間内の学習記録を取得
      const { data: studyRecords, error: recordsError } = await supabase
        .from('study_records')
        .select(`
          *,
          topics (
            chapters (
              subject_id,
              subjects (
                id,
                name
              )
            )
          ),
          practice_exams (
            subject_id,
            subjects (
              id,
              name
            )
          )
        `)
        .gte('studied_at', startDate.toISOString())
        .lte('studied_at', today.toISOString());

      if (recordsError) throw recordsError;

      // 科目ごとの学習時間を集計
      const subjectTimeMap = new Map<string, { name: string; minutes: number }>();
      let total = 0;

      studyRecords?.forEach((record: any) => {
        const minutes = record.study_minutes || 0;
        let subjectId: string | null = null;
        let subjectName: string | null = null;

        if (record.record_type === 'topic' && record.topics) {
          subjectId = record.topics.chapters.subjects.id;
          subjectName = record.topics.chapters.subjects.name;
        } else if (record.record_type === 'practice_exam' && record.practice_exams) {
          subjectId = record.practice_exams.subjects.id;
          subjectName = record.practice_exams.subjects.name;
        }

        if (subjectId && subjectName) {
          const current = subjectTimeMap.get(subjectId) || { name: subjectName, minutes: 0 };
          current.minutes += minutes;
          subjectTimeMap.set(subjectId, current);
          total += minutes;
        }
      });

      const subjectStatsData: SubjectStudyTime[] = Array.from(subjectTimeMap.entries()).map(
        ([subject_id, data]) => ({
          subject_id,
          subject_name: data.name,
          total_minutes: data.minutes,
        })
      );

      setSubjectStats(subjectStatsData);
      setTotalMinutes(total);

      // 日別の学習時間を集計
      const dailyMap = new Map<string, Map<string, number>>();

      studyRecords?.forEach((record: any) => {
        const date = new Date(record.studied_at).toISOString().split('T')[0];
        const minutes = record.study_minutes || 0;
        let subjectName: string | null = null;

        if (record.record_type === 'topic' && record.topics) {
          subjectName = record.topics.chapters.subjects.name;
        } else if (record.record_type === 'practice_exam' && record.practice_exams) {
          subjectName = record.practice_exams.subjects.name;
        }

        if (!dailyMap.has(date)) {
          dailyMap.set(date, new Map());
        }

        if (subjectName) {
          const dayMap = dailyMap.get(date)!;
          dayMap.set(subjectName, (dayMap.get(subjectName) || 0) + minutes);
        }
      });

      const dailyStatsData: DailyStudyTime[] = Array.from(dailyMap.entries())
        .map(([date, subjectMap]) => {
          const subjects = Array.from(subjectMap.entries()).map(([subject_name, minutes]) => ({
            subject_name,
            minutes,
          }));
          const total_minutes = subjects.reduce((sum, s) => sum + s.minutes, 0);
          return {
            date,
            total_minutes,
            subjects,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      setWeeklyStats(dailyStatsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 期間選択 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedPeriod === 'week'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          過去7日間
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            selectedPeriod === 'month'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          過去30日間
        </button>
      </div>

      {/* 合計学習時間 */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">合計学習時間</h3>
        <p className="text-4xl font-bold text-indigo-600">{formatMinutes(totalMinutes)}</p>
      </div>

      {/* 科目別学習時間（円グラフ） */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">科目別学習時間</h3>
        {subjectStats.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectStats as any}
                    dataKey="total_minutes"
                    nameKey="subject_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.subject_name}: ${formatMinutes(entry.total_minutes)}`}
                  >
                    {subjectStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMinutes(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {subjectStats
                .sort((a, b) => b.total_minutes - a.total_minutes)
                .map((subject, index) => (
                  <div key={subject.subject_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold text-gray-800">{subject.subject_name}</span>
                    </div>
                    <span className="text-indigo-600 font-bold">{formatMinutes(subject.total_minutes)}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">データがありません</p>
        )}
      </div>

      {/* 日別学習時間（棒グラフ） */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">日別学習時間</h3>
        {weeklyStats.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tickFormatter={(minutes) => `${minutes}分`} />
                <Tooltip
                  formatter={(value: number) => formatMinutes(value)}
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString('ja-JP', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    });
                  }}
                />
                <Legend />
                <Bar dataKey="total_minutes" fill="#4F46E5" name="学習時間" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">データがありません</p>
        )}
      </div>
    </div>
  );
}