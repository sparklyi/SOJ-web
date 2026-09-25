"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { useBrowserSessionAvailable } from "@/components/auth/use-browser-session";
import { CodeWorkspace, type WorkspaceValue } from "@/components/soj/code-workspace";
import { Button } from "@/components/ui/button";
import { restoreSession } from "@/lib/auth/session";
import { RunResultView } from "@/features/runs/run-result-view";
import { useRun } from "@/features/runs/use-run";
import { SubmissionResultCard } from "@/features/submissions/submission-result-card";
import { useSubmission } from "@/features/submissions/use-submission";
import { readProblemDraft, writeProblemDraft } from "./problem-draft";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

/** 供父层（题面示例）命令式地往「自定义输入」里填一段文本。 */
export type ProblemSubmitHandle = {
  fillStdin: (text: string) => void;
};

/** 草稿随敲随存，但不必每个按键都写一次 localStorage。 */
const DRAFT_SAVE_DEBOUNCE_MS = 400;

function browserStorage() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function browserUserId(): number | null {
  if (typeof window === "undefined") return null;
  return restoreSession(window.localStorage)?.user.id ?? null;
}

// 首次挂载时用第一个可用语言的草稿初始化编辑器。面板只在语言目录就绪后才挂载，
// 所以这里能拿到确定的第一个语言。
function initialWorkspace(problemId: number, languages: JudgeLanguage[]): WorkspaceValue {
  const languageId = languages[0]?.id;
  const draft = languageId === undefined ? undefined : loadDraft(problemId, languageId);
  return { languageId, sourceCode: draft?.sourceCode ?? "", stdin: draft?.stdin ?? "" };
}

function loadDraft(problemId: number, languageId: number) {
  const userId = browserUserId();
  if (userId === null) return undefined;
  return readProblemDraft(browserStorage(), userId, problemId, languageId);
}

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
export const ProblemSubmitPanel = forwardRef<ProblemSubmitHandle, ProblemSubmitPanelProps>(function ProblemSubmitPanel(
  { problem, languages },
  ref,
) {
  const { t } = useI18n();
  const [workspace, setWorkspace] = useState<WorkspaceValue>(() => initialWorkspace(problem.id, languages));
  // 语言目录可能异步到达：workspace.languageId 为空时派生到第一个可用语言，
  // 用户在下拉里显式切换后（CodeWorkspace 会写回 languageId）以用户选择为准。
  const languageId = workspace.languageId ?? languages[0]?.id;
  const { state: submissionState, submit, continuePolling } = useSubmission();
  const hasSession = useBrowserSessionAvailable();
  const needsSession = !hasSession;
  const hasCode = Boolean(languageId && workspace.sourceCode.trim());
  const canSubmit = !needsSession && hasCode && submissionState.status !== "pending";
  const { state: runState, run, continuePolling: continueRunPolling } = useRun();
  const canRun = !needsSession && hasCode && runState.status !== "pending";

  // 切换语言是用户事件：新语言有草稿就恢复它，没有就把 next 原样交回，
  // 让 CodeWorkspace 按「源码是不是模板」决定换模板还是保留源码。
  // 注意**不能**把源码重置成空串：那会让「空且未种过」的判定失效，
  // 于是切到新语言时模板永远种不上。
  const handleWorkspaceChange = useCallback(
    (next: WorkspaceValue) => {
      if (next.languageId === undefined || next.languageId === workspace.languageId) {
        setWorkspace(next);
        return;
      }
      const draft = loadDraft(problem.id, next.languageId);
      if (draft) {
        setWorkspace({ languageId: next.languageId, sourceCode: draft.sourceCode, stdin: draft.stdin });
        return;
      }
      setWorkspace(next);
    },
    [problem.id, workspace.languageId],
  );

  useImperativeHandle(
    ref,
    () => ({
      fillStdin: (text: string) => setWorkspace((current) => ({ ...current, stdin: text })),
    }),
    [],
  );

  // 随敲随存（防抖）。提交不清空：草稿与提交内容天然一致。
  useEffect(() => {
    const userId = browserUserId();
    if (userId === null || languageId === undefined || workspace.sourceCode.trim() === "") return;
    const handle = setTimeout(() => {
      writeProblemDraft(browserStorage(), userId, problem.id, languageId, {
        sourceCode: workspace.sourceCode,
        stdin: workspace.stdin,
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [languageId, problem.id, workspace.sourceCode, workspace.stdin]);

  const handleSubmit = useCallback(() => {
    if (needsSession || !languageId || !workspace.sourceCode.trim()) return;
    void submit({ problemId: problem.id, languageId, sourceCode: workspace.sourceCode });
  }, [languageId, needsSession, problem.id, submit, workspace.sourceCode]);

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
    <aside
      className="grid gap-4 lg:sticky lg:top-24 lg:self-start"
      // 编辑器里的 Ctrl/Cmd+Enter 冒泡到这里触发「运行测试」：这是 OJ 的通用快捷键，
      // 挂在提交侧栏容器上，所以只在焦点位于编辑器/侧栏内时生效。
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          handleRun();
        }
      }}
    >
      <CodeWorkspace
        languages={languages}
        value={workspace}
        onChange={handleWorkspaceChange}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="flex-1"
              disabled={!canRun}
              onClick={handleRun}
              title={t("problems.runShortcutHint")}
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
                : submissionState.status === "pending"
                  ? t("problems.submitting")
                  : t("problems.submitAction")}
            </Button>
          </>
        }
      />
      {needsSession ? (
        <p className="text-sm text-soj-muted">
          <LocalizedLink className="text-soj-accent transition hover:opacity-80" href="/auth/login">
            {t("problems.signIn")}
          </LocalizedLink>{" "}
          {t("problems.signInHint")}
        </p>
      ) : null}
      <SubmissionResultCard state={submissionState} onContinuePolling={() => void continuePolling()} />
      <RunResultView state={runState} onContinuePolling={() => void continueRunPolling()} />
    </aside>
  );
});
