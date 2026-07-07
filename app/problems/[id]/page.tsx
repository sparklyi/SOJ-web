import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { listEnabledLanguages } from "@/features/languages/api";
import { getProblem } from "@/features/problems/api";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";
import { isNotFoundError } from "@/lib/api/errors";

type ProblemDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { id } = await params;
  const problemId = Number(id);

  if (!Number.isInteger(problemId)) {
    notFound();
  }

  const result = await Promise.all([getProblem(problemId), listEnabledLanguages()]).catch((error: unknown) => {
    if (isNotFoundError(error)) return null;
    throw error;
  });

  if (!result) {
    notFound();
  }

  const [problem, languages] = result;

  return (
    <PageShell>
      <ProblemDetailView problem={problem} languages={languages.items} />
    </PageShell>
  );
}
