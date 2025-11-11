import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CPA学習管理システム
          </h1>
          <p className="text-lg text-gray-600">
            公認会計士試験の学習進捗と復習を管理
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <Link href="/tantoushiki">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  短答式
                </h2>
                <p className="text-gray-600">
                  財務会計論・管理会計論<br />
                  監査論・企業法
                </p>
              </div>
            </div>
          </Link>

          <Link href="/ronbunshiki">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-5xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  論文式
                </h2>
                <p className="text-gray-600">
                  会計学・監査論・企業法<br />
                  租税法・経営学
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
  <div className="flex justify-center gap-4 flex-wrap">
    <Link href="/profile">
      <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
        プレイヤーカード
      </button>
    </Link>
    <Link href="/review">
      <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
        今日の復習
      </button>
    </Link>
    <Link href="/stats">
      <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
        学習統計
      </button>
    </Link>
  </div>
</div>
      </div>
    </div>
  );
}