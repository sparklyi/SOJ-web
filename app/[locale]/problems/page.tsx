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
import { matchesProblemFilter } from "@/lib/domain/problem";
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
 * 进度的词条与列表行、状态筛选器共用同一套（已解决 / 已尝试 / 未开始），
 * 并且整组标注「我的进度」——题目是公共的，这三档说的是我和题目的关系，
 * 曾经把它们写成「热身 / 复习 / 未开始」，读起来像题目自己的分类，
 * 而且三种词性（动作建议 × 动作建议 × 进度）挤在一根轴上，轴本身就不成立。
 *
 * 上一版页头同时放了三类东西：四个进度数字、一条难度堆叠条、一套图例，
 * 于是在表格出现之前，读者要先读完一整屏与自己无关的统计。
 */
export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = (await searchParams) ?? {};
  const t = await getServerTranslator();
  const filter = parseFilter(params);
  // 只取一次全量列表，筛选在内存里做。之前这里 fetch 两遍（全量 + 筛选后），
  // 每次点筛选都打两遍后端 API，列表页的「卡一下」大半是这个延迟。
  const allProblems = await listProblems();
  const filteredItems = allProblems.items.filter((problem) => matchesProblemFilter(problem, filter));
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
          meta={
            <div className="grid gap-2.5">
              <span className="soj-eyebrow">{t("problems.myProgress")}</span>
              <StatGroup>
                <Stat label={t("status.solved")} value={acceptedCount} />
                <StatDivider />
                <Stat label={t("status.attempted")} value={attemptedCount} />
                <StatDivider />
                <Stat label={t("status.todo")} value={todoCount} />
              </StatGroup>
            </div>
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
          <ProblemList problems={filteredItems} totalCount={allProblems.total} />
        </Panel>
      </div>
    </PageShell>
  );
}
