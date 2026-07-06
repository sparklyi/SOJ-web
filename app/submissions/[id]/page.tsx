import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { getSubmission } from "@/features/submissions/api";
import { SubmissionDetail } from "@/features/submissions/submission-detail";
import { isNotFoundError } from "@/lib/api/errors";

type SubmissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params;
  const submissionId = Number(id);

  if (!Number.isInteger(submissionId)) {
    notFound();
  }

  const submission = await getSubmission(submissionId).catch((error: unknown) => {
    if (isNotFoundError(error)) return null;
    throw error;
  });

  if (!submission) {
    notFound();
  }

  return (
    <PageShell title={`Submission #${submission.id}`} description="Lifecycle feedback, test point progress, and contest impact.">
      <SubmissionDetail submission={submission} />
    </PageShell>
  );
}
