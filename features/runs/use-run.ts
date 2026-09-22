"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunSummary } from "@/lib/api/types";
import { createBrowserApiClient } from "@/lib/api/client";
import { useI18n } from "@/components/providers/i18n-provider";
import { isSubmissionTerminal } from "@/lib/domain/submission";

export const RUN_POLL_INTERVAL_MS = 1200;
export const RUN_POLL_DEADLINE_MS = 30_000;

export type RunRequest = {
  languageId: number;
  sourceCode: string;
  stdin?: string;
  /**
   * 省略即为「自由运行」（练习场）：服务端不会校验任何题目。
   * 传值则把这次运行归属到该题目，并要求题目处于可评测状态。
   */
  problemId?: number;
};

/**
 * 运行状态机。
 *
 * `stillRunning` 是一个**独立**状态，不是 `pending` 的延续：轮询到截止时间
 * 只是「前端停止等待」，不代表后端停了，也不代表失败。把它混进 pending
 * 会让界面永远转圈；混进 error 则会撒谎。它必须能被渲染成
 * 「仍在运行（已 Xs）+ 继续查询」。
 */
export type RunState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; run: RunSummary }
  | { status: "stillRunning"; run: RunSummary; elapsedMs: number }
  | { status: "error"; message: string };

type PollOutcome = { run: RunSummary; timedOut: boolean };

export type UseRunOptions = {
  pollIntervalMs?: number;
  deadlineMs?: number;
};

export type UseRunResult = {
  state: RunState;
  /** 发起一次运行并轮询到终态（或截止）。 */
  run: (request: RunRequest) => Promise<void>;
  /** 对上一次「仍在运行」的 run 再等一轮，重新计时。 */
  continuePolling: () => Promise<void>;
  /** 回到 idle，用于换语言或清空输出。 */
  reset: () => void;
};

/**
 * 发起 self-run 并轮询到终态。题目页与练习场共用——两边的差别只在
 * 请求里带不带 `problemId`，运行与等待的逻辑一个字都不该有两份。
 */
export function useRun(options: UseRunOptions = {}): UseRunResult {
  const pollIntervalMs = options.pollIntervalMs ?? RUN_POLL_INTERVAL_MS;
  const deadlineMs = options.deadlineMs ?? RUN_POLL_DEADLINE_MS;
  const { t } = useI18n();
  const [state, setState] = useState<RunState>({ status: "idle" });
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const settle = useCallback(
    async (created: RunSummary) => {
      const startedAt = Date.now();
      const outcome = await pollToTerminal(created, {
        pollIntervalMs,
        deadlineMs,
        isAlive: () => aliveRef.current,
      });
      // 组件已卸载：不要 setState，也不要覆盖新一次运行的状态。
      if (outcome === null) return;

      if (outcome.timedOut) {
        setState({ status: "stillRunning", run: outcome.run, elapsedMs: Date.now() - startedAt });
        return;
      }
      setState({ status: "success", run: outcome.run });
    },
    [deadlineMs, pollIntervalMs],
  );

  const run = useCallback(
    async (request: RunRequest) => {
      setState({ status: "pending" });
      try {
        const created = await createBrowserApiClient().runs.create(request);
        await settle(created);
      } catch (error) {
        if (!aliveRef.current) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : t("problems.runFailed"),
        });
      }
    },
    [settle, t],
  );

  const continuePolling = useCallback(async () => {
    const current = state.status === "stillRunning" ? state.run : null;
    if (!current) return;
    try {
      const latest = await createBrowserApiClient().runs.get(current.id);
      await settle(latest);
    } catch (error) {
      if (!aliveRef.current) return;
      setState({
        status: "error",
        message: error instanceof Error ? error.message : t("problems.runFailed"),
      });
    }
  }, [settle, state, t]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, continuePolling, reset };
}

/**
 * 轮询到终态，或直到截止时间。返回 `timedOut` 让调用方区分
 * 「跑完了」和「不等了」——这两种情况对用户的意义完全不同。
 */
async function pollToTerminal(
  initial: RunSummary,
  options: { pollIntervalMs: number; deadlineMs: number; isAlive: () => boolean },
): Promise<PollOutcome | null> {
  const client = createBrowserApiClient();
  const deadline = Date.now() + options.deadlineMs;
  let current = initial;

  while (!isSubmissionTerminal(current.status) && Date.now() < deadline) {
    await sleep(options.pollIntervalMs);
    if (!options.isAlive()) return null;
    current = await client.runs.get(current.id);
  }

  return { run: current, timedOut: !isSubmissionTerminal(current.status) };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
