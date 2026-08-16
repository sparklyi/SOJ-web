import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
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
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <ContestScoreboardPage contest={contest} scoreboard={scoreboard} />
      </main>
    </div>
  );
}
