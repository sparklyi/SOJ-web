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
  const query = firstParam(params.query);
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

  return (
    <PageShell
      title="Problem set"
      description="Search the training hall, scan judge state, and enter a problem without leaving the Signal Arena flow."
    >
      <div className="grid gap-5">
        <Suspense>
          <ProblemFilterBar
            query={filter.query}
            difficulty={filter.difficulty}
            status={filter.status}
            tag={filter.tag}
            tags={tags}
          />
        </Suspense>
        <ProblemList problems={filteredProblems.items} />
      </div>
    </PageShell>
  );
}
