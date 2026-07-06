import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { getProblem } from "@/features/problems/api";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";

type ProblemDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { id } = await params;
  const problemId = Number(id);

  if (!Number.isInteger(problemId)) {
    notFound();
  }

  const problem = await getProblem(problemId).catch(() => null);

  if (!problem) {
    notFound();
  }

  return (
    <PageShell>
      <ProblemDetailView problem={problem} />
    </PageShell>
  );
}
