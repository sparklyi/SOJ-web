"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { ProblemDifficulty, ProblemStatus } from "@/lib/api/types";
import { tallyDifficulty } from "@/components/soj/difficulty-composition";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import type { ProblemFilter } from "@/lib/domain/problem";
import { matchesProblemFilter } from "@/lib/domain/problem";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProblemFilterBar } from "@/features/problems/problem-filter-bar";
import { ProblemList } from "@/features/problems/problem-list";

const difficulties: ProblemDifficulty[] = ["easy", "medium", "hard"];
const statuses: ProblemStatus[] = ["todo", "attempted", "accepted"];

/**
 * 题库页（客户端取数）。
 *
 * 题库内容已全部要求登录（后端把题目读接口锁到已登录 actor），而服务端组件
 * 拿不到浏览器里的会话，匿名 SSR 只会拿到 401。所以这一页改为：会话落定后
 * 由浏览器客户端带 token 取数；匿名访客在上游的 `SessionGate` 处停下。
 *
 * 页头只放**关于我的进度**，不放题库的目录统计。
 * 理由是这两种数字的用途完全不同：进度回答「我练到哪了」，
 * 是用户自己会关心的；而目录统计（一共几道题、几道困难）只在挑题的那一刻有用，
 * 所以它应该出现在挑题的地方——也就是表格上沿那排难度按钮上，而不是页头。
 *
 * 进度的词条与列表行、状态筛选器共用同一套（已解决 / 已尝试 / 未开始），
 * 并且整组标注「我的进度」——题目是公共的，这三档说的是我和题目的关系。
 *
 * 只取一次全量列表，筛选在内存里做：换筛选只改 searchParams，不再重新拉数据。
 */
export function ProblemListClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const filter = parseFilter(Object.fromEntries(searchParams.entries()));

  const state = useAuthedData(() => createBrowserApiClient().problems.list());

  if (state.status === "loading" || state.status === "auth") {
    return (
      <div className="grid gap-4" aria-hidden>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (state.status === "notFound" || state.status === "error") {
    return (
      <Panel variant="flush">
        <p className="px-6 py-12 text-center text-sm text-soj-muted">
          {state.status === "error" ? state.message : t("common.loadError")}
        </p>
      </Panel>
    );
  }

  const allProblems = state.data;
  const filteredItems = allProblems.items.filter((problem) => matchesProblemFilter(problem, filter));
  const tags = Array.from(new Set(allProblems.items.flatMap((problem) => problem.tags))).sort();
  const acceptedCount = allProblems.items.filter((problem) => problem.status === "accepted").length;
  const attemptedCount = allProblems.items.filter((problem) => problem.status === "attempted").length;
  const todoCount = allProblems.items.filter((problem) => problem.status === "todo").length;
  const difficultyCounts = tallyDifficulty(allProblems.items);

  return (
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
  );
}

function parseFilter(params: Record<string, string>): ProblemFilter {
  const query = params.q ?? params.query;
  const difficulty = params.difficulty;
  const status = params.status;
  const tag = params.tag;

  return {
    query,
    difficulty: difficulties.includes(difficulty as ProblemDifficulty) ? (difficulty as ProblemDifficulty) : undefined,
    status: statuses.includes(status as ProblemStatus) ? (status as ProblemStatus) : undefined,
    tag: tag || undefined,
  };
}
