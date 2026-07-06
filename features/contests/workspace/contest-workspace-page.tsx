import { SplitWorkspace } from "@/components/layout/split-workspace";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ContestClock } from "@/components/soj/contest-clock";
import { ProblemStatement } from "@/components/soj/problem-statement";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { Button } from "@/components/ui/button";
import type { ContestSummary, ProblemDetail } from "@/lib/api/types";

type ContestWorkspacePageProps = {
  contest: ContestSummary & {
    phase: string;
    canSubmit: boolean;
  };
  problem: ProblemDetail;
};

const timelineItems = [
  { id: "queued", status: "queued" as const, label: "Queued by contest judge", timestamp: "10:12:01" },
  { id: "compiling", status: "compiling" as const, label: "Compiling with GNU C++17", timestamp: "10:12:04" },
  { id: "running", status: "running" as const, label: "Running sample and hidden tests", timestamp: "10:12:08" },
];

const testPoints = [
  { index: 1, status: "accepted" as const, score: 10 },
  { index: 2, status: "accepted" as const, score: 10 },
  { index: 3, status: "running" as const, score: 0 },
  { index: 4, status: "queued" as const, score: 0 },
  { index: 5, status: "queued" as const, score: 0 },
  { index: 6, status: "queued" as const, score: 0 },
];

export function ContestWorkspacePage({ contest, problem }: ContestWorkspacePageProps) {
  const alias = contest.problems.find((item) => item.problemId === problem.id)?.alias ?? "A";
  const freezeLabel = contest.status === "frozen" ? "Submissions are hidden from public rank" : "Rank updates are visible";

  return (
    <SplitWorkspace
      className="items-start"
      primary={
        <div className="grid min-w-0 gap-4">
          <section className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">Problem {alias}</StatusPill>
              <StatusPill tone={contest.type === "acm" ? "info" : "warning"}>{contest.type.toUpperCase()}</StatusPill>
              <StatusPill tone={contest.status === "frozen" ? "warning" : "accent"}>{contest.status}</StatusPill>
            </div>
            <ProblemStatement problem={problem} />
          </section>
          <CodeWorkspace
            language="C++17"
            value={`#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  // Build the signal graph and keep the shortest confirmed route.
  return 0;
}`}
          />
        </div>
      }
      secondary={
        <div className="grid min-w-0 gap-4">
          <ContestClock label={contest.status === "frozen" ? "Freeze active" : "Freeze in"} value="00:47:18" frozen={contest.status === "frozen"} />

          <section className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
            <div className="flex items-center justify-between gap-3 border-b border-soj-line pb-3">
              <h2 className="text-base font-semibold text-soj-text">Submit risk</h2>
              <StatusPill tone={contest.canSubmit ? "warning" : "danger"}>{contest.canSubmit ? "Contest live" : "Blocked"}</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-soj-muted">
              <p>{freezeLabel}.</p>
              <p>Wrong answers add one attempt and ACM penalty after acceptance.</p>
              <Button disabled={!contest.canSubmit} className="mt-1 w-full">
                Submit solution
              </Button>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-base font-semibold text-soj-text">Judge feedback</h2>
            <SubmissionTimeline items={timelineItems} />
          </section>

          <section className="grid gap-3 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-soj-text">Test points</h2>
              <StatusPill tone="accent">Running</StatusPill>
            </div>
            <TestPointMatrix points={testPoints} />
          </section>

          <SignalFeed
            items={[
              { id: "rank", label: "Rank impact", value: "+2 on AC", tone: "accent" },
              { id: "penalty", label: "Current penalty", value: "312", tone: "neutral" },
              { id: "queue", label: "Judge queue", value: "3 ahead", tone: "warning" },
            ]}
          />
        </div>
      }
    />
  );
}
