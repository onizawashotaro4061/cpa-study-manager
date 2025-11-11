'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Subject, Chapter, Topic, PracticeExam } from '@/lib/types';
import { calculateReviewDates, formatDateForDB } from '@/utils/reviewSchedule';
import { awardXP } from '@/utils/xpSystem';

export default function RonbunshikiSubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subject as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<{ [chapterId: string]: Topic[] }>({});
  const [practiceExams, setPracticeExams] = useState<PracticeExam[]>([]);
  const [studiedTopicIds, setStudiedTopicIds] = useState<Set<string>>(new Set());
  const [completedExamIds, setCompletedExamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 新規追加用のstate
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState<string | null>(null);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamNumber, setNewExamNumber] = useState('');

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  async function fetchSubjectData() {
    try {
      // 科目情報を取得
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      if (subjectError) throw subjectError;
      setSubject(subjectData);

      // 章を取得
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // 各章の論点を取得
      const topicsMap: { [chapterId: string]: Topic[] } = {};
      for (const chapter of chaptersData || []) {
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('chapter_id', chapter.id)
          .order('order_index');

        if (topicsError) throw topicsError;
        topicsMap[chapter.id] = topicsData || [];
      }
      setTopics(topicsMap);

      // 答練を取得
      const { data: examsData, error: examsError } = await supabase
        .from('practice_exams')
        .select('*')
        .eq('subject_id', subjectId)
        .order('exam_number');

      if (examsError) throw examsError;
      setPracticeExams(examsData || []);

      // 学習済み論点を取得
      const allTopicIds = Object.values(topicsMap).flat().map(t => t.id);
      if (allTopicIds.length > 0) {
        const { data: studiedTopics } = await supabase
          .from('study_records')
          .select('topic_id')
          .eq('record_type', 'topic')
          .in('topic_id', allTopicIds);

        setStudiedTopicIds(new Set(studiedTopics?.map(s => s.topic_id).filter(Boolean) || []));
      }

      // 完了答練を取得
      const examIds = examsData?.map(e => e.id) || [];
      if (examIds.length > 0) {
        const { data: completedExams } = await supabase
          .from('study_records')
          .select('practice_exam_id')
          .eq('record_type', 'practice_exam')
          .in('practice_exam_id', examIds);

        setCompletedExamIds(new Set(completedExams?.map(e => e.practice_exam_id).filter(Boolean) || []));
      }

    } catch (error) {
      console.error('Error fetching subject data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addChapter() {
    if (!newChapterName.trim()) return;

    try {
      const { error } = await supabase
        .from('chapters')
        .insert({
          subject_id: subjectId,
          name: newChapterName,
          order_index: chapters.length + 1,
        });

      if (error) throw error;

      setNewChapterName('');
      setShowAddChapter(false);
      fetchSubjectData();
    } catch (error) {
      console.error('Error adding chapter:', error);
    }
  }

  async function addTopic(chapterId: string) {
    if (!newTopicName.trim()) return;

    try {
      const chapterTopics = topics[chapterId] || [];
      const { error } = await supabase
        .from('topics')
        .insert({
          chapter_id: chapterId,
          name: newTopicName,
          order_index: chapterTopics.length + 1,
        });

      if (error) throw error;

      setNewTopicName('');
      setShowAddTopic(null);
      fetchSubjectData();
    } catch (error) {
      console.error('Error adding topic:', error);
    }
  }

  async function addPracticeExam() {
    if (!newExamName.trim() || !newExamNumber) return;

    try {
      const { error } = await supabase
        .from('practice_exams')
        .insert({
          subject_id: subjectId,
          name: newExamName,
          exam_number: parseInt(newExamNumber),
        });

      if (error) throw error;

      setNewExamName('');
      setNewExamNumber('');
      setShowAddExam(false);
      fetchSubjectData();
    } catch (error) {
      console.error('Error adding practice exam:', error);
    }
  }






async function recordStudy(topicId: string) {
  // 学習時間を入力するプロンプトを追加
  const minutesStr = prompt('学習時間を入力してください（分）:');
  if (!minutesStr) return;
  
  const minutes = parseInt(minutesStr);
  if (isNaN(minutes) || minutes <= 0) {
    alert('正しい数値を入力してください');
    return;
  }

  try {
    // 学習記録を作成
    const { data: studyRecord, error: recordError } = await supabase
      .from('study_records')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        record_type: 'topic',
        topic_id: topicId,
        studied_at: new Date().toISOString(),
        study_minutes: minutes,
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // 復習スケジュールを作成
    const reviewDates = calculateReviewDates(new Date());
    const schedules = reviewDates.map((date, index) => ({
      study_record_id: studyRecord.id,
      review_number: index + 1,
      scheduled_date: formatDateForDB(date),
    }));

    const { error: scheduleError } = await supabase
      .from('review_schedules')
      .insert(schedules);

    if (scheduleError) throw scheduleError;

    // XPを付与
    const xpResult = await awardXP(subjectId, 'topic', minutes);
    
    if (xpResult.success) {
      let message = `+${xpResult.xpGained} XP獲得!`;
      if (xpResult.leveledUp) {
        message += `\n🎉 ランクアップ！${xpResult.newRank}`;
      }
      alert(message);
    }

    // UIを更新
    setStudiedTopicIds(new Set([...studiedTopicIds, topicId]));
  } catch (error) {
    console.error('Error recording study:', error);
    alert('記録に失敗しました');
  }
}

async function recordPracticeExam(examId: string) {
  // 学習時間を入力するプロンプトを追加
  const minutesStr = prompt('学習時間を入力してください（分）:');
  if (!minutesStr) return;
  
  const minutes = parseInt(minutesStr);
  if (isNaN(minutes) || minutes <= 0) {
    alert('正しい数値を入力してください');
    return;
  }

  try {
    // 学習記録を作成
    const { data: studyRecord, error: recordError } = await supabase
      .from('study_records')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        record_type: 'practice_exam',
        practice_exam_id: examId,
        studied_at: new Date().toISOString(),
        study_minutes: minutes,
      })
      .select()
      .single();

    if (recordError) throw recordError;

    // 復習スケジュールを作成
    const reviewDates = calculateReviewDates(new Date());
    const schedules = reviewDates.map((date, index) => ({
      study_record_id: studyRecord.id,
      review_number: index + 1,
      scheduled_date: formatDateForDB(date),
    }));

    const { error: scheduleError } = await supabase
      .from('review_schedules')
      .insert(schedules);

    if (scheduleError) throw scheduleError;

    // XPを付与
    const xpResult = await awardXP(subjectId, 'practice_exam', minutes);
    
    if (xpResult.success) {
      let message = `+${xpResult.xpGained} XP獲得!`;
      if (xpResult.leveledUp) {
        message += `\n🎉 ランクアップ！${xpResult.newRank}`;
      }
      alert(message);
    }

    // UIを更新
    setCompletedExamIds(new Set([...completedExamIds, examId]));
  } catch (error) {
    console.error('Error recording practice exam:', error);
    alert('記録に失敗しました');
  }
}

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">科目が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/ronbunshiki')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4"
          >
            ← 論文式ダッシュボードに戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{subject.name}</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* インプット（論点） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">インプット</h2>
              <button
                onClick={() => setShowAddChapter(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
              >
                + 章を追加
              </button>
            </div>

            {showAddChapter && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="章の名前"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addChapter}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddChapter(false);
                      setNewChapterName('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{chapter.name}</h3>
                    <button
                      onClick={() => setShowAddTopic(chapter.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      + 論点追加
                    </button>
                  </div>

                  {showAddTopic === chapter.id && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="論点の名前"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addTopic(chapter.id)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                        >
                          追加
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTopic(null);
                            setNewTopicName('');
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {topics[chapter.id]?.map((topic) => {
                      const isStudied = studiedTopicIds.has(topic.id);
                      return (
                        <div
                          key={topic.id}
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            isStudied ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm ${isStudied ? 'text-green-800 line-through' : 'text-gray-700'}`}>
                            {topic.name}
                          </span>
                          {!isStudied && (
                            <button
                              onClick={() => recordStudy(topic.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold"
                            >
                              完了
                            </button>
                          )}
                          {isStudied && (
                            <span className="text-green-600 text-xs font-semibold">✓ 学習済み</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* アウトプット（答練） */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">アウトプット</h2>
              <button
                onClick={() => setShowAddExam(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
              >
                + 答練を追加
              </button>
            </div>

            {showAddExam && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="答練の名前"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <input
                  type="number"
                  value={newExamNumber}
                  onChange={(e) => setNewExamNumber(e.target.value)}
                  placeholder="答練番号"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addPracticeExam}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddExam(false);
                      setNewExamName('');
                      setNewExamNumber('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {practiceExams.map((exam) => {
                const isCompleted = completedExamIds.has(exam.id);
                return (
                  <div
                    key={exam.id}
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      isCompleted ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <span className={`font-semibold ${isCompleted ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                        {exam.name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">#{exam.exam_number}</span>
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => recordPracticeExam(exam.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                      >
                        完了
                      </button>
                    )}
                    {isCompleted && (
                      <span className="text-green-600 text-sm font-semibold">✓ 完了</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}