"use client";

import type { PageResult, ProblemSummary } from "@/lib/api/types";
import type { ProblemFilter } from "@/lib/domain/problem";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatGroup } from "@/components/ui/stat";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProblemFilterBar } from "./problem-filter-bar";
import { ProblemList } from "./problem-list";
import { ProblemPagination } from "./problem-pagination";

/** The server supplies one filtered page and the matching total. */
export function ProblemListClient({ initialProblems, filter }: { initialProblems: PageResult<ProblemSummary>; filter: ProblemFilter }) {
  const { t } = useI18n();
  const tags = Array.from(new Set(initialProblems.items.flatMap((problem) => problem.tags))).sort();

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={t("problems.practiceControl")} title={t("problems.pageTitle")} meta={<StatGroup><Stat label={t("problems.total")} value={initialProblems.total} /></StatGroup>} />
      <Panel variant="flush">
        <ProblemFilterBar key={JSON.stringify([filter.query, filter.tag])} query={filter.query} difficulty={filter.difficulty} tag={filter.tag} tags={tags} />
        <ProblemList problems={initialProblems.items} />
        <ProblemPagination page={filter.page ?? 1} pageSize={filter.pageSize ?? 20} total={initialProblems.total} />
      </Panel>
    </div>
  );
}
