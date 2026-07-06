import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ContestArenaPage } from "@/features/arena/contest-arena-page";
import { getContest, getContestArenaEvents, getContestScoreboard } from "@/features/contests/api";
import { isNotFoundError } from "@/lib/api/errors";

type ContestArenaRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContestArenaRoute({ params }: ContestArenaRouteProps) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  const result = await Promise.all([
    getContest(contestId),
    getContestArenaEvents(contestId),
    getContestScoreboard(contestId),
  ]).catch((error: unknown) => {
    if (isNotFoundError(error)) return null;
    throw error;
  });

  if (!result) {
    notFound();
  }

  const [contest, events, scoreboard] = result;

  return (
    <PageShell title="Arena" description={`${contest.title} live big-screen view for rank movement, freeze countdown, key submissions, accepted events, and score deltas.`}>
      <ContestArenaPage contest={contest} events={events} scoreboard={scoreboard} />
    </PageShell>
  );
}
