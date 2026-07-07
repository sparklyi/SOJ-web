import type { ProblemDetail } from "@/lib/api/types";

export function ProblemStatement({ problem }: { problem: ProblemDetail }) {
  return (
    <article className="space-y-7 text-soj-text">
      <header className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-soj-accent">Problem brief</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{problem.title}</h1>
        </div>
        <p className="rounded-soj-md border border-soj-line/55 bg-soj-bg/30 px-3 py-2 font-mono text-sm text-soj-muted">
          {problem.timeLimitMs} ms / {Math.round(problem.memoryLimitKb / 1024)} MB
        </p>
      </header>
      <section className="border-t border-soj-line/55 pt-6">
        <h2 className="text-lg font-semibold">Statement</h2>
        <p className="mt-2 leading-7 text-soj-muted">{problem.statement}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="border-l border-soj-line/60 pl-4">
          <h2 className="text-lg font-semibold">Input</h2>
          <p className="mt-2 leading-7 text-soj-muted">{problem.input}</p>
        </div>
        <div className="border-l border-soj-line/60 pl-4">
          <h2 className="text-lg font-semibold">Output</h2>
          <p className="mt-2 leading-7 text-soj-muted">{problem.output}</p>
        </div>
      </section>
    </article>
  );
}
