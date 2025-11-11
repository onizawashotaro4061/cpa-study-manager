import Link from 'next/link';
import ProgressBar from './ProgressBar';
import { SubjectProgress } from '@/lib/types';

interface SubjectCardProps {
  subjectProgress: SubjectProgress;
  examType: 'tantoushiki' | 'ronbunshiki';
}

export default function SubjectCard({ subjectProgress, examType }: SubjectCardProps) {
  const { subject, totalTopics, studiedTopics, totalPracticeExams, completedPracticeExams, progressPercentage } = subjectProgress;

  return (
    <Link href={`/${examType}/${subject.id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{subject.name}</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>インプット進捗</span>
              <span>{studiedTopics} / {totalTopics} 論点</span>
            </div>
            <ProgressBar percentage={totalTopics > 0 ? (studiedTopics / totalTopics) * 100 : 0} />
          </div>

          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>アウトプット進捗</span>
              <span>{completedPracticeExams} / {totalPracticeExams} 答練</span>
            </div>
            <ProgressBar percentage={totalPracticeExams > 0 ? (completedPracticeExams / totalPracticeExams) * 100 : 0} />
          </div>

          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">総合進捗</span>
              <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}