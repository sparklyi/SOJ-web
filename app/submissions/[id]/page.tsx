import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
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
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <SubmissionDetailClient submissionId={submissionId} />
      </main>
    </div>
  );
}
