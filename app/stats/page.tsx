import StudyStats from '@/components/StudyStats';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学習統計</h1>
          <p className="text-gray-600">学習時間の記録と分析</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <StudyStats />
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