import type { ProblemDetail } from "@/lib/api/types";
import { ProblemStatement } from "@/components/soj/problem-statement";
import { ProblemSubmitPanel } from "./problem-submit-panel";

type ProblemDetailViewProps = {
  problem: ProblemDetail;
};

export function ProblemDetailView({ problem }: ProblemDetailViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5 md:p-6">
        <ProblemStatement problem={problem} />
        <section className="mt-8 border-t border-soj-line pt-6">
          <h2 className="text-lg font-semibold text-soj-text">Examples</h2>
          <div className="mt-4 grid gap-4">
            {problem.examples.map((example, index) => (
              <div key={`${example.input}-${index}`} className="grid gap-3 rounded-soj-md border border-soj-line bg-soj-surface p-4">
                <div className="font-mono text-xs text-soj-muted">Example {index + 1}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-soj-text">Input</h3>
                    <pre className="mt-2 overflow-auto rounded-soj-sm bg-soj-bg p-3 font-mono text-sm leading-6 text-soj-muted">
                      <code>{example.input}</code>
                    </pre>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-soj-text">Output</h3>
                    <pre className="mt-2 overflow-auto rounded-soj-sm bg-soj-bg p-3 font-mono text-sm leading-6 text-soj-muted">
                      <code>{example.output}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8 border-t border-soj-line pt-6">
          <h2 className="text-lg font-semibold text-soj-text">Constraints</h2>
          <ul className="mt-3 grid gap-2">
            {problem.constraints.map((constraint) => (
              <li key={constraint} className="font-mono text-sm leading-6 text-soj-muted">
                {constraint}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ProblemSubmitPanel problem={problem} />
    </div>
  );
}
