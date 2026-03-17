import Link from "next/link";

type SectionItemProps = {
  section: {
    id: number;
    title: string;
    videos: Array<{
      id: number;
      title: string;
      locked: boolean;
      is_completed: boolean;
    }>;
  };
  currentVideoId?: number;
  subjectId: number;
};

export const SectionItem = ({
  section,
  currentVideoId,
  subjectId
}: SectionItemProps) => {
  const completedCount = section.videos.filter((video) => video.is_completed).length;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/90">
          {section.title}
        </p>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/72">
          {completedCount}/{section.videos.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {section.videos.map((video) => (
          <Link
            className={`block rounded-2xl px-3 py-3 text-sm transition ${
              video.locked
                ? "cursor-not-allowed bg-white/5 text-mist/40"
                : currentVideoId === video.id
                  ? "bg-white text-ink shadow-[0_16px_30px_rgba(7,17,31,0.22)]"
                  : "bg-white/10 text-mist hover:bg-white/15"
            }`.trim()}
            href={video.locked ? "#" : `/subjects/${subjectId}/video/${video.id}`}
            key={video.id}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  video.locked
                    ? "bg-white/25"
                    : video.is_completed
                      ? "bg-[#10a37f]"
                      : "bg-white/35"
                }`.trim()}
              />
              {video.title}
            </span>
            <span className="mt-1 block text-xs opacity-75">
              {video.locked
                ? "Locked"
                : video.is_completed
                  ? "Completed"
                  : "Unlocked"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
