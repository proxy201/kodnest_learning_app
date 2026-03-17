export const VideoProgressBar = ({
  currentTime,
  duration
}: {
  currentTime: number;
  duration: number;
}) => {
  const progressPercent =
    duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="progress-track h-3 overflow-hidden rounded-full">
        <div
          className="progress-fill h-full rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
        <span>{Math.round(currentTime)}s watched</span>
        <span>{duration ? `${Math.round(duration)}s total` : "estimating..."}</span>
      </div>
    </div>
  );
};
