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

export interface StudyTimeLog {
  id: string;
  user_id: string;
  subject_id: string;
  study_date: string;
  minutes: number;
  memo: string | null;
  created_at: string;
}

export interface SubjectStudyTime {
  subject_id: string;
  subject_name: string;
  total_minutes: number;
}

export interface DailyStudyTime {
  date: string;
  total_minutes: number;
  subjects: {
    subject_name: string;
    minutes: number;
  }[];
}

export interface WeeklyStudyStats {
  week_start: string;
  total_minutes: number;
  days: DailyStudyTime[];
}
export type Rank = 'C-' | 'C' | 'C+' | 'B-' | 'B' | 'B+' | 'A-' | 'A' | 'A+' | 'S' | 'S+0' | 'S+1' | 'S+2' | 'S+3' | 'S+4' | 'S+5' | 'S+6' | 'S+7' | 'S+8' | 'S+9';

export interface SubjectMastery {
  id: string;
  user_id: string;
  subject_id: string;
  current_xp: number;
  rank: Rank;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  streak_days: number;
  last_study_date: string | null;
  gear_points: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  gear_points: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly';
  target_type: string;
  target_value: number;
  reward_xp: number;
  reward_gear_points: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  challenge?: Challenge;
}

export interface SubjectMasteryWithSubject extends SubjectMastery {
  subject: Subject;
}