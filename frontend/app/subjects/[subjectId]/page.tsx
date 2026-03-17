import { SubjectOverviewShell } from "@/components/subjects/subject-overview-shell";

export default async function SubjectPage({
  params
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  return <SubjectOverviewShell subjectId={Number(subjectId)} />;
}
