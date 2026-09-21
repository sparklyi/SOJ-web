"use client";

import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import { getContest, getContestArenaEvents, getContestScoreboard } from "@/features/contests/api";
import { ContestSubpageState } from "@/features/contests/contest-subpage-state";
import { ContestArenaPage } from "@/features/arena/contest-arena-page";

/**
 * 赛场（客户端取数）。
 *
 * 比赛内容已全部要求登录：会话与登录墙由上游 `SessionGate` 负责，
 * 这里只在已登录的前提下带 token 取数；「比赛不存在」由共用状态组件渲染。
 */
export function ContestArenaClient({ contestId }: { contestId: number }) {
  const state = useAuthedData(() =>
    Promise.all([
      getContest(contestId, createBrowserApiClient()),
      getContestArenaEvents(contestId, createBrowserApiClient()),
      getContestScoreboard(contestId, createBrowserApiClient()),
    ]),
  );

  return (
    <>
      <ContestSubpageState state={state} />
      {state.status === "ready" ? (
        <ContestArenaPage contest={state.data[0]} events={state.data[1]} scoreboard={state.data[2]} />
      ) : null}
    </>
  );
}
