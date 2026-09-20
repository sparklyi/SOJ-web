import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { SubmissionDetailClient } from "@/features/submissions/submission-detail-client";

type SubmissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params;
  const submissionId = Number(id);

  if (!Number.isInteger(submissionId)) {
    notFound();
  }

  return (
    <PageShell>
      <SubmissionDetailClient submissionId={submissionId} />
    </PageShell>
  );
}
