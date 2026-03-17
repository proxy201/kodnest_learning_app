import { SectionItem } from "@/components/sidebar/section-item";

import type { SubjectTree } from "@/lib/subjects";

export const SubjectSidebar = ({
  subjectId,
  tree,
  currentVideoId
}: {
  subjectId: number;
  tree: SubjectTree;
  currentVideoId?: number;
}) => {
  const totalLessons = tree.sections.reduce(
    (total, section) => total + section.videos.length,
    0
  );
  const completedLessons = tree.sections.reduce(
    (total, section) =>
      total + section.videos.filter((video) => video.is_completed).length,
    0
  );

  return (
    <aside className="surface-dark hero-grid rounded-[2rem] p-6 text-mist">
      <p className="eyebrow text-white/62">Outline</p>
      <h2 className="font-display mt-3 text-3xl leading-none text-white">{tree.title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="metric-tile rounded-[1.25rem] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-mist/58">Sections</p>
          <p className="mt-2 text-2xl font-semibold text-white">{tree.sections.length}</p>
        </div>
        <div className="metric-tile rounded-[1.25rem] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-mist/58">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {completedLessons}/{totalLessons}
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {tree.sections.map((section) => (
          <SectionItem
            currentVideoId={currentVideoId}
            key={section.id}
            section={section}
            subjectId={subjectId}
          />
        ))}
      </div>
    </aside>
  );
};
