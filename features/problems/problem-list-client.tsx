"use client";

import { Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { PageResult, ProblemDifficulty, ProblemSummary } from "@/lib/api/types";
import { tallyDifficulty } from "@/components/soj/difficulty-composition";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemFilter } from "@/lib/domain/problem";
import { matchesProblemFilter, problemDifficultyLabelKey } from "@/lib/domain/problem";
import { ProblemFilterBar } from "@/features/problems/problem-filter-bar";
import { ProblemList } from "@/features/problems/problem-list";

const difficulties: ProblemDifficulty[] = ["easy", "medium", "hard"];

/**
 * 题库页（服务端取数 + 客户端筛选）。
 *
 * 题目是公共资产：匿名访客也能读到 published+public 的题目列表与题面，
 * 这是站点曝光的主要落点。列表因此由服务端组件匿名取好后传入，
 * 这里只负责 searchParams 驱动的内存筛选，不再在浏览器里发请求。
 *
 * 页头说**目录构成**：一共几道题、各难度几道。它回答「这个题库有什么」，
 * 对匿名与登录用户是同一个答案。曾经的「我的进度（已解决/已尝试/未开始）」
 * 是假数据——列表接口从不返回按人区分的状态——所以整组撤掉，
 * 而不是换一个标签继续展示没有来源的数字。
 *
 * 只取一次全量列表，筛选在内存里做：换筛选只改 searchParams，不再重新拉数据。
 */
export function ProblemListClient({ initialProblems }: { initialProblems: PageResult<ProblemSummary> }) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const filter = parseFilter(Object.fromEntries(searchParams.entries()));

  const filteredItems = initialProblems.items.filter((problem) => matchesProblemFilter(problem, filter));
  const tags = Array.from(new Set(initialProblems.items.flatMap((problem) => problem.tags))).sort();
  const difficultyCounts = tallyDifficulty(initialProblems.items);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t("problems.practiceControl")}
        title={t("problems.pageTitle")}
        meta={
          <div className="grid gap-2.5">
            <span className="soj-eyebrow">{t("problems.catalog")}</span>
            <StatGroup>
              <Stat label={t("problems.total")} value={initialProblems.total} />
              {difficultyCounts.map((item) => (
                <Fragment key={item.difficulty}>
                  <StatDivider />
                  <Stat label={t(problemDifficultyLabelKey[item.difficulty])} value={item.count} />
                </Fragment>
              ))}
            </StatGroup>
          </div>
        }
      />

      <Panel variant="flush">
        <Suspense>
          <ProblemFilterBar
            query={filter.query}
            difficulty={filter.difficulty}
            tag={filter.tag}
            tags={tags}
            difficultyCounts={difficultyCounts}
          />
        </Suspense>
        <ProblemList problems={filteredItems} totalCount={initialProblems.total} />
      </Panel>
    </div>
  );
}

function parseFilter(params: Record<string, string>): ProblemFilter {
  const query = params.q ?? params.query;
  const difficulty = params.difficulty;
  const tag = params.tag;

  return {
    query,
    difficulty: difficulties.includes(difficulty as ProblemDifficulty) ? (difficulty as ProblemDifficulty) : undefined,
    tag: tag || undefined,
  };
}
