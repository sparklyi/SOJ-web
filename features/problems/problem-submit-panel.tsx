"use client";

import { useCallback, useEffect, useState } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

/**
 * 提交侧栏。
 *
 * 旧实现在这里放了四个带边框的指标格（通过率 / 提交次数 / 时限 / 内存），
 * 与页头重复，且一排小方框把侧栏最宝贵的位置占满。
 * 指标归页头，侧栏只回答「我现在能做什么」：
 * 交互状态、标签、代码、提交。
 */
export function ProblemSubmitPanel({ problem, languages }: ProblemSubmitPanelProps) {
  const { t } = useI18n();
  const [workspace, setWorkspace] = useState<{ languageId?: number; sourceCode: string }>({
    languageId: languages[0]?.id,
    sourceCode: "",
  });
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success"; submissionId: number }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const hasSession = useBrowserSessionAvailable();
  const needsSession = getApiMode() === "http" && !hasSession;
  const canSubmit = !needsSession && Boolean(workspace.languageId && workspace.sourceCode.trim()) && submitState.status !== "pending";

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

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
      {/* 标题块不套面板：侧栏里只留编辑器一个「面」，代码才是焦点。
          状态徽标不再放这里——页头已经写过一次，同一屏出现两枚同样的徽标
          只会稀释它的份量。标签保留：它是「这道题考什么」，属于侧栏的信息。 */}
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
      <Button type="button" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {needsSession ? t("problems.signInToSubmit") : submitState.status === "pending" ? t("problems.submitting") : t("problems.submitSolution")}
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
    </aside>
  );
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

function SubmissionResult({
  state,
}: {
  state:
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success"; submissionId: number }
    | { status: "error"; message: string };
}) {
  const { t } = useI18n();

  if (state.status === "idle") return null;

  if (state.status === "success") {
    return (
      <p className="text-sm text-soj-muted">
        {t("problems.submissionQueued")} {" "}
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
