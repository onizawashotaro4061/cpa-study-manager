export type ExamType = 'tantoushiki' | 'ronbunshiki';

export interface Subject {
  id: string;
  exam_type: ExamType;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface PracticeExam {
  id: string;
  subject_id: string;
  name: string;
  exam_number: number;
  created_at: string;
}

export type RecordType = 'topic' | 'practice_exam';

export interface StudyRecord {
  id: string;
  user_id: string;
  record_type: RecordType;
  topic_id: string | null;
  practice_exam_id: string | null;
  studied_at: string;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  study_record_id: string;
  review_number: number;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface SubjectProgress {
  subject: Subject;
  totalTopics: number;
  studiedTopics: number;
  totalPracticeExams: number;
  completedPracticeExams: number;
  progressPercentage: number;
}

export interface ReviewItem {
  id: string;
  type: 'topic' | 'practice_exam';
  subjectName: string;
  chapterName?: string;
  name: string;
  reviewNumber: number;
  scheduledDate: string;
  studyRecordId: string;
  scheduleId: string;
}