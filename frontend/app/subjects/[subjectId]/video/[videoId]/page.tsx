import { LearnShell } from "@/components/subjects/learn-shell";

export default async function VideoPage({
  params
}: {
  params: Promise<{ subjectId: string; videoId: string }>;
}) {
  const { subjectId, videoId } = await params;

  return (
    <LearnShell
      subjectId={Number(subjectId)}
      videoId={Number(videoId)}
    />
  );
}
