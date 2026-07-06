import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import type { ContestSummary, ProblemSummary, SubmissionSummary } from "@/lib/api/types";

type LiveSignalPanelProps = {
  contest: ContestSummary;
  problem: ProblemSummary;
  submission: SubmissionSummary;
};

export function LiveSignalPanel({ contest, problem, submission }: LiveSignalPanelProps) {
  return (
    <section aria-labelledby="live-signal-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="live-signal-heading" className="text-xl font-semibold text-soj-text">
            Live signal panel
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-soj-muted">Contest state, problem routing, and the newest judge outcome stay visible before users choose a workspace.</p>
        </div>
        <VerdictBadge status={submission.status} />
      </div>
      <SignalFeed
        items={[
          { id: "phase", label: "Contest phase", value: contest.status, tone: contest.status === "running" ? "accent" : "warning" },
          { id: "route", label: "Problem route", value: problem.title, tone: "neutral" },
          { id: "judge", label: "Judge signal", value: submission.problemTitle, tone: submission.status === "accepted" ? "success" : "warning" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <StatusPill tone="accent">rank movement</StatusPill>
        <StatusPill tone="warning">freeze countdown</StatusPill>
        <StatusPill tone="neutral">mock data</StatusPill>
      </div>
    </section>
  );
}
