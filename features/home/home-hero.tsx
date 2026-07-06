import { ContestClock } from "@/components/soj/contest-clock";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import type { ContestSummary, ProblemSummary, SubmissionSummary } from "@/lib/api/types";
import type { ScoreboardGridRow } from "@/components/soj/scoreboard-grid";

type HomeHeroProps = {
  contest: ContestSummary;
  problem: ProblemSummary;
  submission: SubmissionSummary;
  scoreboardRows: ScoreboardGridRow[];
};

export function HomeHero({ contest, problem, submission, scoreboardRows }: HomeHeroProps) {
  const isFrozen = contest.status === "frozen";

  return (
    <section className="grid min-h-[calc(100dvh-8rem)] grid-cols-[minmax(0,1fr)] content-center gap-6 pb-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
      <div className="grid min-w-0 content-center gap-6 border-b border-soj-line pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="accent">Live judge signal</StatusPill>
          <StatusPill tone={isFrozen ? "warning" : "success"}>{contest.status}</StatusPill>
        </div>
        <div className="grid gap-4">
          <h1 className="text-5xl font-semibold leading-none tracking-tight text-soj-text md:text-7xl">SOJ</h1>
          <p className="max-w-xl text-base leading-7 text-soj-muted">
            Enter the current contest, resume a problem, or inspect the judge stream from one dense Signal Arena cockpit.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:justify-start">
          <form action="/problems">
            <Button type="submit" size="lg">
              Problems
            </Button>
          </form>
          <form action="/contests">
            <Button type="submit" variant="secondary" size="lg">
              Contests
            </Button>
          </form>
        </div>
        <form action={`/problems/${problem.id}`} className="max-w-md">
          <Button type="submit" variant="ghost" size="sm">
            Continue {problem.title}
          </Button>
        </form>
      </div>

      <aside aria-label="Live signal panel" className="grid min-w-0 gap-4">
        <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <ContestClock label={isFrozen ? "Freeze active" : "Contest window"} value={isFrozen ? "00:42:18" : "03:18:42"} frozen={isFrozen} />
          <SignalFeed
            items={[
              { id: "contest", label: "Active contest", value: contest.title, tone: "accent" },
              { id: "problem", label: "Recommended problem", value: problem.title, tone: "neutral" },
              { id: "judge", label: "Recent judge", value: submission.status.replaceAll("_", " "), tone: submission.status === "accepted" ? "success" : "warning" },
            ]}
          />
        </div>
        <div className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-soj-text">Scoreboard pulse</h2>
            <StatusPill tone="accent">{contest.type.toUpperCase()}</StatusPill>
          </div>
          <ScoreboardGrid mode={contest.type} rows={scoreboardRows} />
        </div>
      </aside>
    </section>
  );
}
