import PlayerCard from '@/components/PlayerCard';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">プレイヤーカード</h1>
          <p className="text-gray-600">あなたの学習記録と実績</p>
        </div>

        <PlayerCard />

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}