import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { ContestWorkspacePage } from "@/features/contests/workspace/contest-workspace-page";
import { getContest } from "@/features/contests/api";
import { getProblem } from "@/features/problems/api";
import { isNotFoundError } from "@/lib/api/errors";

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

  const result = await Promise.all([getContest(contestId), getProblem(parsedProblemId)]).catch((error: unknown) => {
    if (isNotFoundError(error)) return null;
    throw error;
  });

  if (!result) {
    notFound();
  }

  const [contest, problem] = result;

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <ContestWorkspacePage contest={contest} problem={problem} />
      </main>
    </div>
  );
}
