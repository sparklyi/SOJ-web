"use client";

import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import { getContest } from "@/features/contests/api";
import { getProblem } from "@/features/problems/api";
import { ContestSubpageState } from "@/features/contests/contest-subpage-state";
import { ContestWorkspacePage } from "@/features/contests/workspace/contest-workspace-page";

/**
 * 比赛答题页（客户端取数）。
 *
 * 比赛内容已全部要求登录：会话与登录墙由上游 `SessionGate` 负责，
 * 这里只在已登录的前提下带 token 取数；「比赛或题目不存在」由共用状态组件渲染。
 */
export function ContestWorkspaceClient({ contestId, problemId }: { contestId: number; problemId: number }) {
  const state = useAuthedData(() =>
    Promise.all([getContest(contestId, createBrowserApiClient()), getProblem(problemId, createBrowserApiClient())]),
  );

  return (
    <>
      <ContestSubpageState state={state} />
      {state.status === "ready" ? <ContestWorkspacePage contest={state.data[0]} problem={state.data[1]} /> : null}
    </>
  );
}
