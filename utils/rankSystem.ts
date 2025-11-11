import { Rank } from '@/lib/types';

// ランクとXPの対応表
export const RANK_THRESHOLDS: { rank: Rank; minXP: number; maxXP: number; stars: number }[] = [
  { rank: 'C-', minXP: 0, maxXP: 499, stars: 0 },
  { rank: 'C', minXP: 500, maxXP: 999, stars: 1 },
  { rank: 'C+', minXP: 1000, maxXP: 1999, stars: 2 },
  { rank: 'B-', minXP: 2000, maxXP: 3499, stars: 3 },
  { rank: 'B', minXP: 3500, maxXP: 5499, stars: 4 },
  { rank: 'B+', minXP: 5500, maxXP: 7999, stars: 5 },
  { rank: 'A-', minXP: 8000, maxXP: 10999, stars: 6 },
  { rank: 'A', minXP: 11000, maxXP: 14999, stars: 7 },
  { rank: 'A+', minXP: 15000, maxXP: 19999, stars: 8 },
  { rank: 'S', minXP: 20000, maxXP: 24999, stars: 9 },
  { rank: 'S+0', minXP: 25000, maxXP: 27999, stars: 10 },
  { rank: 'S+1', minXP: 28000, maxXP: 30999, stars: 11 },
  { rank: 'S+2', minXP: 31000, maxXP: 33999, stars: 12 },
  { rank: 'S+3', minXP: 34000, maxXP: 36999, stars: 13 },
  { rank: 'S+4', minXP: 37000, maxXP: 39999, stars: 14 },
  { rank: 'S+5', minXP: 40000, maxXP: 42999, stars: 15 },
  { rank: 'S+6', minXP: 43000, maxXP: 45999, stars: 16 },
  { rank: 'S+7', minXP: 46000, maxXP: 48999, stars: 17 },
  { rank: 'S+8', minXP: 49000, maxXP: 51999, stars: 18 },
  { rank: 'S+9', minXP: 52000, maxXP: Infinity, stars: 19 },
];

/**
 * XPからランクを計算
 */
export function calculateRank(xp: number): Rank {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXP) {
      return RANK_THRESHOLDS[i].rank;
    }
  }
  return 'C-';
}

/**
 * ランク内の進捗率を計算(0-100)
 */
export function calculateRankProgress(xp: number): number {
  const currentRankData = RANK_THRESHOLDS.find(
    r => xp >= r.minXP && xp <= r.maxXP
  );
  
  if (!currentRankData) return 100;
  
  const range = currentRankData.maxXP - currentRankData.minXP + 1;
  const progress = xp - currentRankData.minXP;
  
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * 次のランクまでの必要XPを計算
 */
export function getXPToNextRank(xp: number): number {
  const currentRankData = RANK_THRESHOLDS.find(
    r => xp >= r.minXP && xp <= r.maxXP
  );
  
  if (!currentRankData || currentRankData.rank === 'S+9') return 0;
  
  return currentRankData.maxXP - xp + 1;
}

/**
 * XP獲得量を計算
 */
export function calculateXP(type: 'topic' | 'practice_exam' | 'review', studyMinutes: number, hasStreak: boolean = false): number {
  let baseXP = 0;
  
  switch (type) {
    case 'topic':
      baseXP = 50;
      break;
    case 'practice_exam':
      baseXP = 100;
      break;
    case 'review':
      baseXP = 30;
      break;
  }
  
  let totalXP = baseXP + studyMinutes;
  
  // 連続学習ボーナス
  if (hasStreak) {
    totalXP = Math.round(totalXP * 1.2);
  }
  
  return totalXP;
}

/**
 * ランクの色を取得（スプラトゥーン風）
 */
export function getRankColor(rank: Rank): string {
  if (rank.startsWith('C')) return '#10B981'; // 緑
  if (rank.startsWith('B')) return '#3B82F6'; // 青
  if (rank.startsWith('A')) return '#F59E0B'; // オレンジ
  if (rank.startsWith('S')) return '#EF4444'; // 赤
  return '#6B7280'; // グレー
}

/**
 * ランクのグラデーションを取得
 */
export function getRankGradient(rank: Rank): string {
  if (rank.startsWith('C')) return 'from-green-400 to-green-600';
  if (rank.startsWith('B')) return 'from-blue-400 to-blue-600';
  if (rank.startsWith('A')) return 'from-orange-400 to-orange-600';
  if (rank.startsWith('S')) return 'from-red-400 to-red-600';
  return 'from-gray-400 to-gray-600';
}