import type { ProblemDetail } from "@/lib/api/types";
import { getAcceptanceRate } from "@/lib/domain/problem";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
};

export function ProblemSubmitPanel({ problem }: ProblemSubmitPanelProps) {
  const acceptance = getAcceptanceRate(problem);

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
      <section className="soj-submit-console p-4">
        <div className="relative z-[1] flex items-start justify-between gap-3 border-b border-soj-line/55 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-soj-text">Submit</h2>
            <p className="mt-1 text-sm leading-6 text-soj-muted">Use the workspace for a quick public run.</p>
          </div>
          <ProblemStatus status={problem.status} />
        </div>
        <dl className="relative z-[1] mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Acceptance</dt>
            <dd className="mt-1 font-mono text-soj-text">{acceptance.toFixed(1)}%</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Submissions</dt>
            <dd className="mt-1 font-mono text-soj-text">{problem.submissionCount}</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Time</dt>
            <dd className="mt-1 font-mono text-soj-text">{problem.timeLimitMs} ms</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Memory</dt>
            <dd className="mt-1 font-mono text-soj-text">{Math.round(problem.memoryLimitKb / 1024)} MB</dd>
          </div>
        </dl>
        <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <StatusPill key={tag}>{tag}</StatusPill>
          ))}
        </div>
      </section>
      <CodeWorkspace language="C++17" value={"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  return 0;\n}"} />
      <Button type="button" className="w-full">
        Submit solution
      </Button>
    </aside>
  );
}
