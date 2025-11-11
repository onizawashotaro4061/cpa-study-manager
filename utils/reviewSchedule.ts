// 忘却曲線に基づく復習間隔（日数）
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

/**
 * 学習日から復習スケジュールを計算
 * @param studyDate 学習日
 * @returns 復習予定日の配列
 */
export function calculateReviewDates(studyDate: Date): Date[] {
  return REVIEW_INTERVALS.map(interval => {
    const reviewDate = new Date(studyDate);
    reviewDate.setDate(reviewDate.getDate() + interval);
    return reviewDate;
  });
}

/**
 * 日付をYYYY-MM-DD形式に変換
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export function getTodayString(): string {
  return formatDateForDB(new Date());
}