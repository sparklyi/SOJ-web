import Link from "next/link";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ContestClock } from "@/components/soj/contest-clock";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { Button } from "@/components/ui/button";
import type { ContestSummary, JudgeLanguage, ProblemDetail } from "@/lib/api/types";

type ContestWorkspacePageProps = {
  contest: ContestSummary & {
    phase: string;
    canSubmit: boolean;
  };
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

const timelineItems = [
  { id: "queued", status: "queued" as const, label: "Queued by contest judge", timestamp: "10:12:01" },
  { id: "compiling", status: "compiling" as const, label: "Compiling with selected toolchain", timestamp: "10:12:04" },
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

function formatMemory(value: number) {
  return `${Math.round(value / 1024)} MB`;
}

export function ContestWorkspacePage({ contest, problem, languages }: ContestWorkspacePageProps) {
  const contestProblem = contest.problems.find((item) => item.problemId === problem.id);
  const alias = contestProblem?.alias ?? "A";
  const freezeLabel = contest.status === "frozen" ? "Rank updates hidden" : "Rank updates live";
  const sample = problem.examples[0];

  return (
    <div className="grid gap-6">
      <section className="soj-workspace-stage soj-scanline soj-enter p-5 md:p-7">
        <div className="relative z-[1] grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
          <div className="grid content-between gap-7">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full border border-soj-line/70 bg-soj-bg/34 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-soj-muted transition hover:border-soj-accent/60 hover:text-soj-accent focus-visible:outline-soj-accent"
                  href={`/contests/${contest.id}`}
                >
                  Back
                </Link>
                <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                  Problem {alias}
                </span>
                <StatusPill tone={contest.type === "acm" ? "info" : "warning"}>{contest.type.toUpperCase()}</StatusPill>
                <StatusPill tone={contest.status === "frozen" ? "warning" : "accent"}>{contest.status}</StatusPill>
              </div>
              <div className="grid gap-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">{problem.title}</h1>
                <p className="max-w-2xl text-base leading-7 text-soj-muted">
                  {contest.title} workspace keeps the statement, editor, submit risk, and judge feedback in one focused solve loop.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Time", `${problem.timeLimitMs} ms`],
                ["Memory", formatMemory(problem.memoryLimitKb)],
                ["Tags", `${problem.tags.length} lanes`],
              ].map(([label, value]) => (
                <div key={label} className="soj-submission-metric">
                  <p className="text-xs text-soj-muted">{label}</p>
                  <p className="mt-1 font-mono text-lg text-soj-text">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="soj-workspace-console grid content-between gap-5 p-5">
            <ContestClock label={contest.status === "frozen" ? "Freeze active" : "Freeze in"} value="00:47:18" frozen={contest.status === "frozen"} />
            <div className="grid grid-cols-2 gap-2">
              <div className="soj-submission-chip">
                <span>Submit</span>
                <strong>{contest.canSubmit ? "Open" : "Blocked"}</strong>
              </div>
              <div className="soj-submission-chip">
                <span>Rank</span>
                <strong>{freezeLabel}</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]">
        <section className="soj-workspace-paper grid content-start gap-6 p-5 md:p-6">
          <article className="grid gap-6 text-soj-text">
            <section className="grid gap-2">
              <h2 className="text-xl font-semibold">Statement</h2>
              <p className="leading-7 text-soj-muted">{problem.statement}</p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="soj-workspace-note">
                <h2 className="text-lg font-semibold">Input</h2>
                <p className="mt-2 leading-7 text-soj-muted">{problem.input}</p>
              </div>
              <div className="soj-workspace-note">
                <h2 className="text-lg font-semibold">Output</h2>
                <p className="mt-2 leading-7 text-soj-muted">{problem.output}</p>
              </div>
            </section>

            {sample ? (
              <section className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Sample</h2>
                  <StatusPill tone="neutral">Visible</StatusPill>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">Input</p>
                    <pre className="soj-workspace-sample">
                      <code>{sample.input}</code>
                    </pre>
                  </div>
                  <div className="grid gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">Output</p>
                    <pre className="soj-workspace-sample">
                      <code>{sample.output}</code>
                    </pre>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3">
              <h2 className="text-xl font-semibold">Constraints</h2>
              <div className="flex flex-wrap gap-2">
                {problem.constraints.map((item) => (
                  <span key={item} className="rounded-full border border-soj-line/65 bg-soj-bg/28 px-3 py-1.5 font-mono text-xs text-soj-muted">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          </article>
        </section>

        <aside className="grid min-w-0 gap-6 xl:sticky xl:top-24">
          <section className="soj-workspace-editor grid content-start gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-soj-text">Solve loop</h2>
                <p className="mt-1 text-sm text-soj-muted">Edit, submit, and read judge signal without context switching.</p>
              </div>
              <StatusPill tone={contest.canSubmit ? "accent" : "danger"}>{contest.canSubmit ? "Live" : "Review"}</StatusPill>
            </div>
            <CodeWorkspace
              languages={languages}
              value={`#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  // Build the signal graph and keep the shortest confirmed route.
  return 0;
}`}
            />
            <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <p className="text-sm leading-6 text-soj-muted">
                {contest.status === "frozen" ? "Submissions still run, public rank is frozen." : "Wrong answers add attempts and ACM penalty after acceptance."}
              </p>
              <Button disabled={!contest.canSubmit} size="lg" className="w-full sm:w-auto">
                Submit solution
              </Button>
            </div>
          </section>

          <section aria-label="Judge feedback" className="soj-workspace-panel grid content-start gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Judge feedback</h2>
                <p className="mt-1 text-sm text-soj-muted">Latest run entering the contest judge lane.</p>
              </div>
              <StatusPill tone="accent">Running</StatusPill>
            </div>
            <SubmissionTimeline items={timelineItems} />
          </section>

          <section className="soj-workspace-panel grid content-start gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Test points</h2>
                <p className="mt-1 text-sm text-soj-muted">Visible sample of point states.</p>
              </div>
              <StatusPill tone="warning">Queue 3</StatusPill>
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
        </aside>
      </div>
    </div>
  );
}
