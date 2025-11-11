import { SubjectMasteryWithSubject } from '@/lib/types';
import { calculateRankProgress, getXPToNextRank, getRankColor, getRankGradient } from '@/utils/rankSystem';

interface SubjectMasteryCardProps {
  mastery: SubjectMasteryWithSubject;
}

export default function SubjectMasteryCard({ mastery }: SubjectMasteryCardProps) {
  const progress = calculateRankProgress(mastery.current_xp);
  const xpToNext = getXPToNextRank(mastery.current_xp);
  const rankColor = getRankColor(mastery.rank);
  const rankGradient = getRankGradient(mastery.rank);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* ヘッダー（ランク表示） */}
      <div className={`bg-linear-to-r ${rankGradient} p-6 text-white`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">{mastery.subject.name}</h3>
          <div className="text-3xl font-black tracking-wider">
            {mastery.rank}
          </div>
        </div>
        <div className="text-sm opacity-90">
          {mastery.current_xp.toLocaleString()} XP
        </div>
      </div>

      {/* プログレスバー */}
      <div className="p-6">
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>次のランクまで</span>
          <span className="font-semibold">{xpToNext > 0 ? `${xpToNext} XP` : 'MAX'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              backgroundColor: rankColor
            }}
          />
        </div>
        <div className="mt-2 text-center text-sm font-semibold" style={{ color: rankColor }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}