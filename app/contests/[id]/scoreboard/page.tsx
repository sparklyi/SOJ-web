import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ContestScoreboardPage } from "@/features/contests/scoreboard/contest-scoreboard-page";
import { getContest, getContestScoreboard } from "@/features/contests/api";

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

  const [contest, scoreboard] = await Promise.all([getContest(contestId), getContestScoreboard(contestId)]);

  return (
    <PageShell title="Scoreboard" description={`${contest.title} ranking, freeze state, per-problem results, and movement.`}>
      <ContestScoreboardPage contest={contest} scoreboard={scoreboard} />
    </PageShell>
  );
}
