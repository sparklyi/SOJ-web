import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ContestWorkspacePage } from "@/features/contests/workspace/contest-workspace-page";
import { getContest } from "@/features/contests/api";
import { getProblem } from "@/features/problems/api";

type ContestProblemRouteProps = {
  params: Promise<{
    id: string;
    problemId: string;
  }>;
};

export default async function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const { id, problemId } = await params;
  const contestId = Number(id);
  const parsedProblemId = Number(problemId);

  if (!Number.isInteger(contestId) || !Number.isInteger(parsedProblemId)) {
    notFound();
  }

  const [contest, problem] = await Promise.all([getContest(contestId), getProblem(parsedProblemId)]);

  return (
    <PageShell title={`${contest.title} workspace`} description="Statement, editor, clock, submit risk, and judge feedback stay visible for fast contest solving.">
      <ContestWorkspacePage contest={contest} problem={problem} />
    </PageShell>
  );
}
