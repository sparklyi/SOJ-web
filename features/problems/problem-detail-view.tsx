import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { ProblemStatement } from "@/components/soj/problem-statement";
import { ProblemSubmitPanelLoader } from "./problem-submit-panel-loader";

type ProblemDetailViewProps = {
  problem: ProblemDetail;
  languages?: JudgeLanguage[];
};

export function ProblemDetailView({ problem, languages = [] }: ProblemDetailViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="soj-reading-stage min-w-0 p-5 md:p-7">
        <ProblemStatement problem={problem} />
        <section className="mt-8 border-t border-soj-line/55 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-soj-text">Examples</h2>
            <span className="h-px w-28 soj-hairline" />
          </div>
          <div className="mt-4 grid gap-4">
            {problem.examples.map((example, index) => (
              <div key={`${example.input}-${index}`} className="soj-io-cassette grid gap-3 p-4">
                <div className="font-mono text-xs text-soj-muted">Example {index + 1}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-soj-text">Input</h3>
                    <pre className="mt-2 overflow-auto rounded-soj-sm border border-soj-line/35 bg-soj-bg/45 p-3 font-mono text-sm leading-6 text-soj-muted">
                      <code>{example.input}</code>
                    </pre>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-soj-text">Output</h3>
                    <pre className="mt-2 overflow-auto rounded-soj-sm border border-soj-line/35 bg-soj-bg/45 p-3 font-mono text-sm leading-6 text-soj-muted">
                      <code>{example.output}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8 border-t border-soj-line/55 pt-6">
          <h2 className="text-lg font-semibold text-soj-text">Constraints</h2>
          <ul className="mt-3 grid gap-2">
            {problem.constraints.map((constraint) => (
              <li key={constraint} className="border-l border-soj-accent/35 pl-3 font-mono text-sm leading-6 text-soj-muted">
                {constraint}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ProblemSubmitPanelLoader initialLanguages={languages} problem={problem} />
    </div>
  );
}
