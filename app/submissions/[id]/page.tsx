import { PageShell } from "@/components/layout/page-shell";
import { getSubmission } from "@/features/submissions/api";
import { SubmissionDetail } from "@/features/submissions/submission-detail";

type SubmissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params;
  const submission = await getSubmission(Number(id));

  return (
    <PageShell title={`Submission #${submission.id}`} description="Lifecycle feedback, test point progress, and contest impact.">
      <SubmissionDetail submission={submission} />
    </PageShell>
  );
}
