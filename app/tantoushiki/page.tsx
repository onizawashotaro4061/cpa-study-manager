import Dashboard from '@/components/Dashboard';
import MasteryDashboard from '@/components/MasteryDashboard';

export default function TantoushikiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">短答式試験</h1>
          <p className="text-gray-600">科目ごとの学習進捗と熟練度を確認できます</p>
        </div>

        {/* 熟練度ダッシュボード */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">科目熟練度</h2>
          <MasteryDashboard examType="tantoushiki" />
        </div>

        {/* 従来の進捗ダッシュボード */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">学習進捗</h2>
          <Dashboard examType="tantoushiki" title="" />
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