'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReviewItem } from '@/lib/types';
import { getTodayString } from '@/utils/reviewSchedule';
 import { awardXP } from '@/utils/xpSystem';

export default function ReviewList() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewItems();
  }, []);

  async function fetchReviewItems() {
    try {
      const today = getTodayString();

      // 今日の復習予定を取得
      const { data: schedules, error } = await supabase
        .from('review_schedules')
        .select(`
          id,
          review_number,
          scheduled_date,
          study_record_id,
          study_records (
            id,
            record_type,
            topic_id,
            practice_exam_id,
            topics (
              id,
              name,
              chapters (
                name,
                subjects (
                  name
                )
              )
            ),
            practice_exams (
              id,
              name,
              subjects (
                name
              )
            )
          )
        `)
        .eq('scheduled_date', today)
        .eq('completed', false);

      if (error) throw error;

      if (!schedules) {
        setReviewItems([]);
        return;
      }

      const items = schedules
        .map((schedule: any) => {
          const record = schedule.study_records;

          if (record.record_type === 'topic' && record.topics) {
            const item: ReviewItem = {
              id: schedule.id,
              type: 'topic' as const,
              subjectName: record.topics.chapters.subjects.name,
              chapterName: record.topics.chapters.name,
              name: record.topics.name,
              reviewNumber: schedule.review_number,
              scheduledDate: schedule.scheduled_date,
              studyRecordId: record.id,
              scheduleId: schedule.id,
            };
            return item;
          } else if (record.record_type === 'practice_exam' && record.practice_exams) {
            const item: ReviewItem = {
              id: schedule.id,
              type: 'practice_exam' as const,
              subjectName: record.practice_exams.subjects.name,
              name: record.practice_exams.name,
              reviewNumber: schedule.review_number,
              scheduledDate: schedule.scheduled_date,
              studyRecordId: record.id,
              scheduleId: schedule.id,
            };
            return item;
          }
          return null;
        })
        .filter((item): item is ReviewItem => item !== null);

      setReviewItems(items);
    } catch (error) {
      console.error('Error fetching review items:', error);
    } finally {
      setLoading(false);
    }
  }

async function completeReview(scheduleId: string, item: ReviewItem) {
  try {
    const { error } = await supabase
      .from('review_schedules')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scheduleId);

    if (error) throw error;

    // 科目IDを取得
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', item.subjectName)
      .single();

    if (subjects) {
      // 復習完了でXPを付与（学習時間は0として固定XPのみ）
      const xpResult = await awardXP(subjects.id, 'review', 0);
      
      if (xpResult.success) {
        let message = `+${xpResult.xpGained} XP獲得!`;
        if (xpResult.leveledUp) {
          message += `\n🎉 ランクアップ！${xpResult.newRank}`;
        }
        alert(message);
      }
    }

    // リストを更新
    setReviewItems(reviewItems.filter(i => i.scheduleId !== scheduleId));
  } catch (error) {
    console.error('Error completing review:', error);
    alert('完了処理に失敗しました');
  }
}

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-xl text-gray-600">今日の復習はありません!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviewItems.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                  {item.type === 'topic' ? 'インプット' : 'アウトプット'}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                  {item.reviewNumber}回目の復習
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {item.subjectName}
                {item.chapterName && ` > ${item.chapterName}`}
              </p>
            </div>
            <button
                onClick={() => completeReview(item.scheduleId, item)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                完了
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}