import Link from "next/link";

import { Button } from "@/components/common/button";

export const VideoMeta = ({
  subjectId,
  title,
  description,
  prevVideoId,
  nextVideoId,
  onNext
}: {
  subjectId: number;
  title: string;
  description: string | null;
  prevVideoId: number | null;
  nextVideoId: number | null;
  onNext: () => void;
}) => (
  <div className="surface-panel rounded-[2rem] p-6">
    <p className="eyebrow text-ink/45">Lesson</p>
    <h2 className="font-display mt-3 text-balance text-4xl leading-none text-ink">{title}</h2>
    <p className="mt-4 max-w-3xl text-base leading-7 text-ink/65">
      {description ?? "Continue through the lesson and track your progress automatically."}
    </p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        className="action-secondary rounded-full px-5 py-3 text-sm font-semibold transition"
        href={`/subjects/${subjectId}`}
      >
        Back to Subject
      </Link>
      {prevVideoId ? (
        <Link
          className="action-secondary rounded-full px-5 py-3 text-sm font-semibold transition"
          href={`/subjects/${subjectId}/video/${prevVideoId}`}
        >
          Previous Lesson
        </Link>
      ) : null}
      {nextVideoId ? (
        <Button onClick={onNext} type="button">
          Next Lesson
        </Button>
      ) : null}
    </div>
  </div>
);
