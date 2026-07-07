import { Suspense } from "react";
import type { ProblemDifficulty, ProblemStatus } from "@/lib/api/types";
import type { ProblemFilter } from "@/lib/domain/problem";
import { PageShell } from "@/components/layout/page-shell";
import { listProblems } from "@/features/problems/api";
import { ProblemFilterBar } from "@/features/problems/problem-filter-bar";
import { ProblemList } from "@/features/problems/problem-list";

type ProblemsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const difficulties: ProblemDifficulty[] = ["easy", "medium", "hard"];
const statuses: ProblemStatus[] = ["todo", "attempted", "accepted"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(params: Record<string, string | string[] | undefined>): ProblemFilter {
  const query = firstParam(params.q) ?? firstParam(params.query);
  const difficulty = firstParam(params.difficulty);
  const status = firstParam(params.status);
  const tag = firstParam(params.tag);

  return {
    query,
    difficulty: difficulties.includes(difficulty as ProblemDifficulty) ? (difficulty as ProblemDifficulty) : undefined,
    status: statuses.includes(status as ProblemStatus) ? (status as ProblemStatus) : undefined,
    tag: tag || undefined,
  };
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseFilter(params);
  const [allProblems, filteredProblems] = await Promise.all([listProblems(), listProblems(filter)]);
  const tags = Array.from(new Set(allProblems.items.flatMap((problem) => problem.tags))).sort();
  const acceptedCount = allProblems.items.filter((problem) => problem.status === "accepted").length;
  const attemptedCount = allProblems.items.filter((problem) => problem.status === "attempted").length;
  const hardCount = allProblems.items.filter((problem) => problem.difficulty === "hard").length;
  const completion = allProblems.items.length > 0 ? Math.round((acceptedCount / allProblems.items.length) * 100) : 0;

  return (
    <PageShell>
      <div className="grid gap-6">
        <section className="soj-hero soj-scanline soj-enter p-5 md:p-7">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_392px] lg:items-end">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                  Practice Control
                </span>
                <span className="font-mono text-xs text-soj-muted">{filteredProblems.total} visible / {allProblems.total} total</span>
              </div>
              <div className="grid gap-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">Problem set</h1>
                <p className="max-w-2xl text-base leading-7 text-soj-muted">
                  Search, filter, and enter practice problems from one focused Web workspace.
                </p>
              </div>
            </div>
            <div className="soj-runway lg:-mb-2">
              <span className="soj-runway-crop" aria-hidden />
              <div className="absolute left-4 top-4 z-[1]">
                <p className="text-sm text-soj-muted">Session runway</p>
                <p className="mt-1 font-mono text-3xl text-soj-text">{completion}%</p>
              </div>
              <div className="absolute bottom-4 left-4 right-4 z-[1] grid grid-cols-3 gap-2 font-mono text-[11px] text-soj-muted">
                <span>{acceptedCount} AC</span>
                <span>{attemptedCount} retry</span>
                <span>{hardCount} hard</span>
              </div>
              <span className="soj-packet">JUDGE</span>
              <span className="soj-packet soj-packet-secondary">RETRY</span>
            </div>
          </div>
        </section>

        <div className="soj-workbench grid overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start">
            <Suspense>
              <ProblemFilterBar
                query={filter.query}
                difficulty={filter.difficulty}
                status={filter.status}
                tag={filter.tag}
                tags={tags}
              />
            </Suspense>
            <ProblemList problems={filteredProblems.items} totalCount={allProblems.total} />
          </div>
          <aside className="soj-rail-panel grid content-start">
            <section className="soj-rail-section p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-soj-text">Practice queue</h2>
                <span className="font-mono text-xs text-soj-muted">Mock</span>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  ["Warm up", `${acceptedCount} solved`, "bg-soj-success"],
                  ["Pressure", `${hardCount} hard`, "bg-soj-danger"],
                  ["Review", `${attemptedCount} pending`, "bg-soj-warning"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-soj-md border border-soj-line/45 bg-soj-bg/22 px-3 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition hover:border-soj-accent/35 hover:bg-soj-surface/30">
                    <span className={`h-2 w-2 rounded-full ${tone}`} />
                    <span className="text-sm text-soj-text">{label}</span>
                    <span className="font-mono text-xs text-soj-muted">{value}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="soj-rail-section p-5">
              <h2 className="text-lg font-semibold text-soj-text">Tag lanes</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.slice(0, 8).map((item) => (
                  <span key={item} className="rounded-full border border-soj-line bg-soj-surface/60 px-3 py-1.5 text-xs text-soj-muted">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
