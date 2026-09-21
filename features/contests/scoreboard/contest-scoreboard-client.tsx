"use client";

import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import { getContest, getContestScoreboard } from "@/features/contests/api";
import { ContestSubpageState } from "@/features/contests/contest-subpage-state";
import { ContestScoreboardPage } from "@/features/contests/scoreboard/contest-scoreboard-page";

/**
 * 排行榜（客户端取数）。
 *
 * 比赛内容已全部要求登录：会话与登录墙由上游 `SessionGate` 负责，
 * 这里只在已登录的前提下带 token 取数。
 */
export function ContestScoreboardClient({ contestId }: { contestId: number }) {
  const state = useAuthedData(() =>
    Promise.all([getContest(contestId, createBrowserApiClient()), getContestScoreboard(contestId, createBrowserApiClient())]),
  );

  return (
    <>
      <ContestSubpageState state={state} />
      {state.status === "ready" ? <ContestScoreboardPage contest={state.data[0]} scoreboard={state.data[1]} /> : null}
    </>
  );
}
