import ReviewList from '@/components/ReviewList';

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">今日の復習</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <ReviewList />
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