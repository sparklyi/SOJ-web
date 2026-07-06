import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ContestScoreboardPage } from "@/features/contests/scoreboard/contest-scoreboard-page";
import { getContest, getContestScoreboard } from "@/features/contests/api";
import { isNotFoundError } from "@/lib/api/errors";

type ContestScoreboardRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContestScoreboardRoute({ params }: ContestScoreboardRouteProps) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  const result = await Promise.all([getContest(contestId), getContestScoreboard(contestId)]).catch((error: unknown) => {
    if (isNotFoundError(error)) return null;
    throw error;
  });

  if (!result) {
    notFound();
  }

  const [contest, scoreboard] = result;

  return (
    <PageShell title="Scoreboard" description={`${contest.title} ranking, freeze state, per-problem results, and movement.`}>
      <ContestScoreboardPage contest={contest} scoreboard={scoreboard} />
    </PageShell>
  );
}
