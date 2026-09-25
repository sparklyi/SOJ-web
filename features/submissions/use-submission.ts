"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateSubmissionInput, SubmissionSummary } from "@/lib/api/types";
import { createBrowserApiClient } from "@/lib/api/client";
import { useI18n } from "@/components/providers/i18n-provider";
import { isSubmissionTerminal } from "@/lib/domain/submission";
import { pollToTerminal } from "@/lib/domain/poll";

export const SUBMISSION_POLL_INTERVAL_MS = 1200;
export const SUBMISSION_POLL_DEADLINE_MS = 60_000;

/**
 * 提交状态机。
 *
 * 与 `useRun` 同一套轮询：`stillRunning` 是独立状态，不是 pending 的延续——
 * 轮询到截止只是「前端停止等待」，后端可能仍在评测。混进 pending 会永远转圈，
 * 混进 error 则是撒谎。它必须能被渲染成「仍在评测 + 继续查询」。
 */
export type SubmissionState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; submission: SubmissionSummary }
  | { status: "stillRunning"; submission: SubmissionSummary; elapsedMs: number }
  | { status: "error"; message: string };

export type UseSubmissionOptions = {
  pollIntervalMs?: number;
  deadlineMs?: number;
};

export type UseSubmissionResult = {
  state: SubmissionState;
  /** 发起一次提交并轮询到终态（或截止）。 */
  submit: (input: CreateSubmissionInput) => Promise<void>;
  /** 对上一次「仍在评测」的提交再等一轮，重新计时。 */
  continuePolling: () => Promise<void>;
  /** 回到 idle，用于清空上一次的提示。 */
  reset: () => void;
};

export function useSubmission(options: UseSubmissionOptions = {}): UseSubmissionResult {
  const intervalMs = options.pollIntervalMs ?? SUBMISSION_POLL_INTERVAL_MS;
  const deadlineMs = options.deadlineMs ?? SUBMISSION_POLL_DEADLINE_MS;
  const { t } = useI18n();
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const settle = useCallback(
    async (created: SubmissionSummary) => {
      const startedAt = Date.now();
      const outcome = await pollToTerminal(created, {
        intervalMs,
        deadlineMs,
        isAlive: () => aliveRef.current,
        isTerminal: (submission) => isSubmissionTerminal(submission.status),
        read: (submission) => createBrowserApiClient().submissions.get(submission.id),
      });
      if (outcome === null) return;

      if (outcome.timedOut) {
        setState({ status: "stillRunning", submission: outcome.value, elapsedMs: Date.now() - startedAt });
        return;
      }
      setState({ status: "success", submission: outcome.value });
    },
    [deadlineMs, intervalMs],
  );

  const submit = useCallback(
    async (input: CreateSubmissionInput) => {
      setState({ status: "pending" });
      try {
        const created = await createBrowserApiClient().submissions.create(input);
        await settle(created);
      } catch (error) {
        if (!aliveRef.current) return;
        setState({ status: "error", message: error instanceof Error ? error.message : t("problems.submissionFailed") });
      }
    },
    [settle, t],
  );

  const continuePolling = useCallback(async () => {
    const current = state.status === "stillRunning" ? state.submission : null;
    if (!current) return;
    try {
      const latest = await createBrowserApiClient().submissions.get(current.id);
      await settle(latest);
    } catch (error) {
      if (!aliveRef.current) return;
      setState({ status: "error", message: error instanceof Error ? error.message : t("problems.submissionFailed") });
    }
  }, [settle, state, t]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, submit, continuePolling, reset };
}
