import type { ProblemDetail } from "@/lib/api/types";

export function ProblemStatement({ problem }: { problem: ProblemDetail }) {
  return (
    <article className="space-y-6 text-soj-text">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{problem.title}</h1>
        <p className="mt-2 font-mono text-sm text-soj-muted">
          {problem.timeLimitMs} ms / {Math.round(problem.memoryLimitKb / 1024)} MB
        </p>
      </header>
      <section>
        <h2 className="text-lg font-semibold">Statement</h2>
        <p className="mt-2 leading-7 text-soj-muted">{problem.statement}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Input</h2>
          <p className="mt-2 leading-7 text-soj-muted">{problem.input}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Output</h2>
          <p className="mt-2 leading-7 text-soj-muted">{problem.output}</p>
        </div>
      </section>
    </article>
  );
}
