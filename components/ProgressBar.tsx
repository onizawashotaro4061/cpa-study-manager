interface ProgressBarProps {
  percentage: number;
}

export default function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}