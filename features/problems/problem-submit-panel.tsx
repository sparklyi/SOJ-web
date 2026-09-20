"use client";

import { useCallback, useEffect, useState } from "react";
import type { JudgeLanguage, ProblemDetail, RunSummary } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { CodeWorkspace, type WorkspaceValue } from "@/components/soj/code-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { judgeStatusLabelKey } from "@/lib/domain/submission";
import { restoreSession } from "@/lib/auth/session";
import { formatDuration, formatMemory } from "@/lib/ui/number";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

type SubmitState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; submissionId: number }
  | { status: "error"; message: string };

type RunState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; run: RunSummary }
  | { status: "error"; message: string };

const RUN_POLL_INTERVAL_MS = 1200;
const RUN_POLL_DEADLINE_MS = 30_000;

/**
 * 提交侧栏。
 *
 * 形态对齐成熟 OJ 的提交页：侧栏里只有编辑器一个面板，
 * 「运行测试」与「提交」是面板底部的两个并排动作——运行是次操作（ghost），
 * 提交是主操作（solid）。不再用 Tab 把两个动作藏起来，也没有
 * 「先选模式、再点一次按钮」的双重确认；tag 之类的元信息不进侧栏，
 * 它们属于题目本身，已经在页头与题面里了。
 */
export function ProblemSubmitPanel({ problem, languages }: ProblemSubmitPanelProps) {
  const { t } = useI18n();
  const [workspace, setWorkspace] = useState<WorkspaceValue>({
    languageId: languages[0]?.id,
    sourceCode: "",
    stdin: "",
  });
  // 语言目录可能异步到达：workspace.languageId 为空时派生到第一个可用语言，
  // 用户在下拉里显式切换后（CodeWorkspace 会写回 languageId）以用户选择为准。
  const languageId = workspace.languageId ?? languages[0]?.id;
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [runState, setRunState] = useState<RunState>({ status: "idle" });
  const hasSession = useBrowserSessionAvailable();
  const needsSession = getApiMode() === "http" && !hasSession;
  const hasCode = Boolean(languageId && workspace.sourceCode.trim());
  const canSubmit = !needsSession && hasCode && submitState.status !== "pending";
  const canRun = !needsSession && hasCode && runState.status !== "pending";

  const handleSubmit = useCallback(async () => {
    if (needsSession || !languageId || !workspace.sourceCode.trim()) return;

    setSubmitState({ status: "pending" });
    try {
      const submission = await createBrowserApiClient().submissions.create({
        problemId: problem.id,
        languageId,
        sourceCode: workspace.sourceCode,
      });
      setSubmitState({ status: "success", submissionId: submission.id });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : t("problems.submissionFailed"),
      });
    }
  }, [languageId, needsSession, problem.id, t, workspace.sourceCode]);

  const handleRun = useCallback(async () => {
    if (needsSession || !languageId || !workspace.sourceCode.trim()) return;

    setRunState({ status: "pending" });
    try {
      const client = createBrowserApiClient();
      let run = await client.runs.create({
        problemId: problem.id,
        languageId,
        sourceCode: workspace.sourceCode,
        stdin: workspace.stdin,
      });
      const deadline = Date.now() + RUN_POLL_DEADLINE_MS;
      while (!isTerminalRun(run.status) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, RUN_POLL_INTERVAL_MS));
        run = await client.runs.get(run.id);
      }
      setRunState({ status: "success", run });
    } catch (error) {
      setRunState({
        status: "error",
        message: error instanceof Error ? error.message : t("problems.runFailed"),
      });
    }
  }, [languageId, needsSession, problem.id, t, workspace.sourceCode, workspace.stdin]);

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
      <CodeWorkspace
        languages={languages}
        value={workspace}
        onChange={setWorkspace}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="flex-1"
              disabled={!canRun}
              onClick={handleRun}
            >
              {needsSession
                ? t("problems.signInToRun")
                : runState.status === "pending"
                  ? t("problems.runningTest")
                  : t("problems.runTest")}
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {needsSession
                ? t("problems.signInToSubmit")
                : submitState.status === "pending"
                  ? t("problems.submitting")
                  : t("problems.submitAction")}
            </Button>
          </>
        }
      />
      {needsSession ? (
        <p className="text-sm text-soj-muted">
          <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
            {t("problems.signIn")}
          </LocalizedLink>{" "}
          {t("problems.signInHint")}
        </p>
      ) : null}
      <SubmissionResult state={submitState} />
      <RunResultView state={runState} />
    </aside>
  );
}

/**
 * Self-run 不返回 accepted/wrong_answer 这类对拍结论，只回执行结果；
 * queued/compiling/running 之外都视为终态，直接展示输出。
 */
function isTerminalRun(status: RunSummary["status"]) {
  return status !== "queued" && status !== "compiling" && status !== "running";
}

function browserHasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(restoreSession(window.localStorage));
}

function useBrowserSessionAvailable() {
  const [available, setAvailable] = useState(() => getApiMode() === "mock");

  useEffect(() => {
    function update() {
      setAvailable(getApiMode() === "mock" || browserHasSession());
    }

    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return available;
}

function SubmissionResult({ state }: { state: SubmitState }) {
  const { t } = useI18n();

  if (state.status === "idle") return null;

  if (state.status === "success") {
    return (
      <p className="text-sm text-soj-muted">
        {t("problems.submissionQueued")}{" "}
        <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href={`/submissions/${state.submissionId}`}>
          {t("problems.viewDetails")}
        </LocalizedLink>
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-soj-danger">{state.message}</p>;
  }

  return <p className="text-sm text-soj-muted">{t("problems.sendingSource")}</p>;
}

function RunResultView({ state }: { state: RunState }) {
  const { t, locale } = useI18n();

  if (state.status === "idle") return null;

  if (state.status === "pending") {
    return <p className="text-sm text-soj-muted">{t("problems.runningTest")}</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-soj-danger">{state.message}</p>;
  }

  const { run } = state;
  const outputBlock = (label: string, text: string | undefined) =>
    text ? (
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">{label}</p>
        <pre className="soj-well mt-2 overflow-auto p-3 font-mono text-[13px] leading-6 text-soj-text">
          <code>{text}</code>
        </pre>
      </div>
    ) : null;

  return (
    <div className="grid gap-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={run.status === "accepted" ? "success" : run.status === "queued" ? "neutral" : "danger"} size="sm">
          {t(judgeStatusLabelKey[run.status])}
        </Badge>
        {run.timeMs != null ? (
          <span className="text-xs text-soj-muted">
            {t("problems.time")} {formatDuration(run.timeMs, locale)}
          </span>
        ) : null}
        {run.memoryKb != null ? (
          <span className="text-xs text-soj-muted">
            {t("problems.memory")} {formatMemory(run.memoryKb, locale)}
          </span>
        ) : null}
      </div>
      {run.compileOutput ? outputBlock(t("problems.compileOutput"), run.compileOutput) : null}
      {outputBlock(t("problems.runOutput"), run.stdout)}
      {outputBlock(t("problems.runErrorOutput"), run.stderr)}
      {run.errorMessage ? <p className="text-sm text-soj-danger">{run.errorMessage}</p> : null}
    </div>
  );
}
