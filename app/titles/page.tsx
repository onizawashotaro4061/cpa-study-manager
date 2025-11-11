import TitleList from '@/components/TitleList';

export default function TitlesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">称号コレクション</h1>
          <p className="text-gray-600">獲得した称号を確認・装備できます</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <TitleList />
        </div>

        <div className="mt-8 text-center">
          <a href="/profile" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← プレイヤーカードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}