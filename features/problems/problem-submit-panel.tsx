"use client";

import { useCallback, useState } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { useBrowserSessionAvailable } from "@/components/auth/use-browser-session";
import { CodeWorkspace, type WorkspaceValue } from "@/components/soj/code-workspace";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { RunResultView } from "@/features/runs/run-result-view";
import { useRun } from "@/features/runs/use-run";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

type SubmitState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; submissionId: number }
  | { status: "error"; message: string };

/**
 * 提交侧栏。
 *
 * 形态对齐成熟 OJ 的提交页：侧栏里只有编辑器一个面板，
 * 「运行测试」与「提交」是面板底部的两个并排动作——运行是次操作（ghost），
 * 提交是主操作（solid）。不再用 Tab 把两个动作藏起来，也没有
 * 「先选模式、再点一次按钮」的双重确认；tag 之类的元信息不进侧栏，
 * 它们属于题目本身，已经在页头与题面里了。
 *
 * 运行与结果渲染已抽到 `features/runs`：练习场要用的是**同一套**东西，
 * 只差请求里带不带 `problemId`。留在这里的只有题目特有的部分——
 * 提交、以及提交结果的提示。
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
  const hasSession = useBrowserSessionAvailable();
  const needsSession = getApiMode() === "http" && !hasSession;
  const hasCode = Boolean(languageId && workspace.sourceCode.trim());
  const canSubmit = !needsSession && hasCode && submitState.status !== "pending";
  const { state: runState, run, continuePolling } = useRun();
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

  const handleRun = useCallback(() => {
    if (needsSession || !languageId || !workspace.sourceCode.trim()) return;
    void run({
      problemId: problem.id,
      languageId,
      sourceCode: workspace.sourceCode,
      stdin: workspace.stdin,
    });
  }, [languageId, needsSession, problem.id, run, workspace.sourceCode, workspace.stdin]);

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
      <RunResultView state={runState} onContinuePolling={() => void continuePolling()} />
    </aside>
  );
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
