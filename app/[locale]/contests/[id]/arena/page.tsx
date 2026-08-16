import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
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
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <ContestArenaPage contest={contest} events={events} scoreboard={scoreboard} />
      </main>
    </div>
  );
}
