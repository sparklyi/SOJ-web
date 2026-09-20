"use client";

import { useCallback, useEffect, useState } from "react";
import type { JudgeLanguage, ProblemDetail, RunSummary } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
 * 提交侧栏：标准 OJ 的「测试 + 提交」双模式。
 *
 * 同一个代码工作区，底下两个动作：
 * - 测试：代码 + 自定义 stdin 走 self-run（不计入正式评测），实时轮询直到出结果；
 * - 提交：代码进入正式评测队列，结果去「我的提交」看。
 *
 * 指标归页头，侧栏只回答「我现在能做什么」。
 */
export function ProblemSubmitPanel({ problem, languages }: ProblemSubmitPanelProps) {
  const { t } = useI18n();
  const [workspace, setWorkspace] = useState<{ languageId?: number; sourceCode: string }>({
    languageId: languages[0]?.id,
    sourceCode: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [stdin, setStdin] = useState("");
  const [runState, setRunState] = useState<RunState>({ status: "idle" });
  const hasSession = useBrowserSessionAvailable();
  const needsSession = getApiMode() === "http" && !hasSession;
  const hasCode = Boolean(workspace.languageId && workspace.sourceCode.trim());
  const canSubmit = !needsSession && hasCode && submitState.status !== "pending";

  const handleSubmit = useCallback(async () => {
    if (needsSession || !workspace.languageId || !workspace.sourceCode.trim()) return;

    setSubmitState({ status: "pending" });
    try {
      const submission = await createBrowserApiClient().submissions.create({
        problemId: problem.id,
        languageId: workspace.languageId,
        sourceCode: workspace.sourceCode,
      });
      setSubmitState({ status: "success", submissionId: submission.id });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : t("problems.submissionFailed"),
      });
    }
  }, [needsSession, problem.id, t, workspace.languageId, workspace.sourceCode]);

  const handleRun = useCallback(async () => {
    if (needsSession || !workspace.languageId || !workspace.sourceCode.trim()) return;

    setRunState({ status: "pending" });
    try {
      const client = createBrowserApiClient();
      let run = await client.runs.create({
        problemId: problem.id,
        languageId: workspace.languageId,
        sourceCode: workspace.sourceCode,
        stdin,
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
  }, [needsSession, problem.id, stdin, t, workspace.languageId, workspace.sourceCode]);

  const canRun = !needsSession && hasCode && runState.status !== "pending";

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
      {/* 标题块不套面板：侧栏里只留编辑器一个「面」，代码才是焦点。 */}
      <div className="grid gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="text-sm font-semibold text-soj-text">{t("problems.submitTitle")}</h2>
          <p className="text-xs leading-5 text-soj-muted">{t("problems.submitDescription")}</p>
        </div>
        {problem.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Badge key={tag} tone="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <CodeWorkspace languages={languages} onChange={setWorkspace} />

      <Tabs defaultValue="submit">
        <TabsList aria-label={t("problems.workspaceModes")}>
          <TabsTrigger value="submit">{t("problems.tabSubmit")}</TabsTrigger>
          <TabsTrigger value="test">{t("problems.tabTest")}</TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="grid gap-3">
          <Button type="button" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            {needsSession
              ? t("problems.signInToSubmit")
              : submitState.status === "pending"
                ? t("problems.submitting")
                : t("problems.submitSolution")}
          </Button>
          {needsSession ? (
            <p className="text-sm text-soj-muted">
              <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                {t("problems.signIn")}
              </LocalizedLink>{" "}
              {t("problems.signInHint")}
            </p>
          ) : null}
          <SubmissionResult state={submitState} />
        </TabsContent>

        <TabsContent value="test" className="grid gap-3">
          <Textarea
            id="problem-run-stdin"
            label={t("problems.stdinLabel")}
            helperText={t("problems.stdinHint")}
            className="min-h-32 font-mono text-[13px]"
            spellCheck={false}
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
          />
          <Button type="button" size="lg" className="w-full" disabled={!canRun} onClick={handleRun}>
            {needsSession
              ? t("problems.signInToRun")
              : runState.status === "pending"
                ? t("problems.runningTest")
                : t("problems.runTest")}
          </Button>
          {needsSession ? (
            <p className="text-sm text-soj-muted">
              <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                {t("problems.signIn")}
              </LocalizedLink>{" "}
              {t("problems.signInHint")}
            </p>
          ) : null}
          <RunResultView state={runState} />
        </TabsContent>
      </Tabs>
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
