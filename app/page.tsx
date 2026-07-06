import { PageShell } from "@/components/layout/page-shell";
import { ActiveContests } from "@/features/home/active-contests";
import { HomeHero } from "@/features/home/home-hero";
import { LiveSignalPanel } from "@/features/home/live-signal-panel";
import { RecentJudgeFeed } from "@/features/home/recent-judge-feed";
import { RecommendedProblems } from "@/features/home/recommended-problems";
import { getContestScoreboard, listContests } from "@/features/contests/api";
import { listProblems } from "@/features/problems/api";
import { listSubmissions } from "@/features/submissions/api";

export default async function HomePage() {
  const [{ items: contests }, { items: problems }, { items: submissions }] = await Promise.all([
    listContests(),
    listProblems(),
    listSubmissions(),
  ]);

  const activeContests = contests.filter((contest) => contest.status === "running" || contest.status === "frozen");
  const featuredContest = activeContests[0] ?? contests[0];
  const recommendedProblems = problems.filter((problem) => problem.status !== "accepted").slice(0, 3);
  const featuredProblem = recommendedProblems[0] ?? problems[0];
  const acceptedSubmission = submissions.find((submission) => submission.status === "accepted");
  const recentSubmissions = acceptedSubmission
    ? [acceptedSubmission, ...submissions.filter((submission) => submission.id !== acceptedSubmission.id).slice(0, 2)]
    : submissions.slice(0, 3);
  const featuredSubmission = acceptedSubmission ?? recentSubmissions[0];
  const scoreboard = await getContestScoreboard(featuredContest.id);
  const scoreboardRows = scoreboard.rows.slice(0, 3).map((row) => ({
    id: row.id,
    rank: row.rank,
    handle: row.handle,
    solved: "solved" in row ? row.solved : undefined,
    penalty: "penalty" in row ? row.penalty : undefined,
    score: "score" in row ? row.score : undefined,
    movement: row.movement,
  }));

  return (
    <PageShell>
      <div className="grid min-w-0 gap-10">
        <HomeHero contest={featuredContest} problem={featuredProblem} submission={featuredSubmission} scoreboardRows={scoreboardRows} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <ActiveContests contests={activeContests} />
          <LiveSignalPanel contest={featuredContest} problem={featuredProblem} submission={featuredSubmission} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
          <RecommendedProblems problems={recommendedProblems} />
          <RecentJudgeFeed submissions={recentSubmissions} />
        </div>
      </div>
    </PageShell>
  );
}
