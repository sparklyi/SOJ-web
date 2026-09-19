import { Suspense } from "react";
import type { ProblemDifficulty, ProblemStatus } from "@/lib/api/types";
import type { ProblemFilter } from "@/lib/domain/problem";
import { PageShell } from "@/components/layout/page-shell";
import { tallyDifficulty } from "@/components/soj/difficulty-composition";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { listProblems } from "@/features/problems/api";
import { ProblemFilterBar } from "@/features/problems/problem-filter-bar";
import { ProblemList } from "@/features/problems/problem-list";
import { getServerTranslator } from "@/lib/i18n/server";

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

/**
 * 题库页。
 *
 * 页头只放**关于我的进度**，不放题库的目录统计。
 * 理由是这两种数字的用途完全不同：进度回答「我练到哪了」，
 * 是用户自己会关心的；而目录统计（一共几道题、几道困难）只在挑题的那一刻有用，
 * 所以它应该出现在挑题的地方——也就是表格上沿那排难度按钮上，而不是页头。
 *
 * 上一版页头同时放了三类东西：四个进度数字、一条难度堆叠条、一套图例，
 * 于是在表格出现之前，读者要先读完一整屏与自己无关的统计。
 */
export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = (await searchParams) ?? {};
  const t = await getServerTranslator();
  const filter = parseFilter(params);
  const [allProblems, filteredProblems] = await Promise.all([listProblems(), listProblems(filter)]);
  const tags = Array.from(new Set(allProblems.items.flatMap((problem) => problem.tags))).sort();
  const acceptedCount = allProblems.items.filter((problem) => problem.status === "accepted").length;
  const attemptedCount = allProblems.items.filter((problem) => problem.status === "attempted").length;
  const todoCount = allProblems.items.filter((problem) => problem.status === "todo").length;
  const difficultyCounts = tallyDifficulty(allProblems.items);

  return (
    <PageShell>
      <div className="grid gap-6">
        <PageHeader
          eyebrow={t("problems.practiceControl")}
          title={t("problems.pageTitle")}
          description={t("problems.pageDescription")}
          meta={
            <StatGroup>
              <Stat label={t("problems.warmUp")} value={acceptedCount} tone="success" />
              <StatDivider />
              <Stat label={t("problems.review")} value={attemptedCount} tone="warning" />
              <StatDivider />
              <Stat label={t("problems.todo")} value={todoCount} tone="faint" />
            </StatGroup>
          }
        />

        <Panel variant="flush">
          <Suspense>
            <ProblemFilterBar
              query={filter.query}
              difficulty={filter.difficulty}
              status={filter.status}
              tag={filter.tag}
              tags={tags}
              difficultyCounts={difficultyCounts}
            />
          </Suspense>
          <ProblemList problems={filteredProblems.items} totalCount={allProblems.total} />
        </Panel>
      </div>
    </PageShell>
  );
}
