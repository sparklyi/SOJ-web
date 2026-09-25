"use client";

import { Fragment, useEffect, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { MetricFeed, type MetricFeedItem } from "@/components/soj/metric-feed";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { TypeExit } from "@/components/soj/type-exit";
import { VerdictHeadline, verdictSurfaceClass } from "@/components/soj/verdict-badge";
import { Panel } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { JudgeStatus, SubmissionSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import { cn } from "@/lib/ui/cn";
import { formatDuration, formatMemory } from "@/lib/ui/number";
import type { getSubmission } from "./api";
import { SubmissionImpact } from "./submission-impact";

type SubmissionDetailProps = {
  submission: Awaited<ReturnType<typeof getSubmission>>;
};

function formatSubmittedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * 还没有跑过的提交（排队 / 编译中 / 编译失败 / 系统错误），耗时与内存是
 * **不存在**，不是「等待中」。空值就是破折号。换算走 `lib/ui/number` 的唯一实现。
 */
const dash = "—";

function timeValue(value: number | undefined, locale: string) {
  return typeof value === "number" ? formatDuration(value, locale) : dash;
}

function memoryValue(value: number | undefined, locale: string) {
  return typeof value === "number" ? formatMemory(value, locale) : dash;
}

function statusPoints(submission: SubmissionSummary) {
  return (submission.cases ?? []).map((testCase) => ({
    index: testCase.caseIndex,
    status: testCase.status,
  }));
}

/**
 * 失败原因。编译错误与运行时错误的口径来自诊断信息（仅管理员可见），
 * 其余情况回落到首个失败测试点或通用反馈词条。返回 null 表示「没有额外可说的」，
 * 调用方据此决定要不要渲染这一行，而不是渲染一个「正常」的占位。
 */
function failureDetail(submission: SubmissionSummary, t: Translator): string | null {
  if (submission.status === "compile_error") {
    return submission.adminDiagnostics?.compileOutputSummary ?? submission.errorMessage ?? t("submissions.feedback.compileError");
  }
  if (submission.status === "runtime_error") {
    return submission.adminDiagnostics?.stderrSummary ?? submission.errorMessage ?? t("submissions.feedback.runtimeError");
  }
  if (submission.status === "system_error") {
    return submission.adminDiagnostics?.errorMessage ?? submission.errorMessage ?? t("submissions.feedback.systemError");
  }
  if (submission.errorMessage) return submission.errorMessage;
  const firstFailedCase = submission.result?.firstFailedCaseIndex;
  if (typeof firstFailedCase === "number") return t("submissions.detail.mismatch", { index: firstFailedCase });

  const lines: Record<JudgeStatus, MessageKey | undefined> = {
    queued: "submissions.feedback.queued",
    compiling: "submissions.feedback.compiling",
    running: "submissions.feedback.running",
    accepted: "submissions.feedback.accepted",
    wrong_answer: "submissions.feedback.wrongAnswer",
    runtime_error: undefined,
    compile_error: undefined,
    time_limit: "submissions.feedback.timeLimit",
    memory_limit: "submissions.feedback.memoryLimit",
    canceled: "submissions.feedback.canceled",
    system_error: undefined,
  };
  const key = lines[submission.status];
  return key ? t(key) : null;
}

function diagnosticItems(submission: SubmissionSummary, t: Translator, locale: string): MetricFeedItem[] {
  const diagnostics = submission.adminDiagnostics;
  return [
    { id: "time", label: t("submissions.detail.time"), value: timeValue(submission.timeMs, locale), tone: "neutral" },
    { id: "memory", label: t("submissions.detail.memory"), value: memoryValue(submission.memoryKb, locale), tone: "neutral" },
    { id: "compile", label: t("submissions.detail.compile"), value: diagnostics?.compileOutputSummary ?? t("submissions.value.ready"), tone: diagnostics?.compileOutputSummary ? "warning" : "neutral" },
    { id: "runtime", label: t("submissions.detail.runtime"), value: diagnostics?.stderrSummary ?? t("submissions.value.nominal"), tone: diagnostics?.stderrSummary ? "danger" : "neutral" },
    { id: "system", label: t("submissions.detail.system"), value: diagnostics?.errorMessage ?? t("submissions.value.nominal"), tone: diagnostics?.errorMessage ? "danger" : "neutral" },
  ];
}

/**
 * 提交详情。
 *
 * 版式按「结论 → 证据 → 源码」组织，只渲染这次提交真的有的东西：
 *   · 结论：判定、耗时/内存、失败原因——一眼拿到顶层答案；
 *   · 证据：测试点矩阵（有 cases 才出现）；诊断信息仅管理员可见；
 *   · 源码：本人 / 管理员 / 本场 owner·judge 可读，懒加载。
 *
 * 删掉的东西及理由：
 *   · 「评测生命周期」时间线是拿终态反推的假流水，时间戳全是同一刻，没有信息量；
 *   · 「比赛影响」只在比赛提交上出现，练习提交不再渲染一个「练习 / 无」的空面板；
 *   · 「运行时与系统信息」对普通用户没有可行动信息，收进管理员诊断区。
 */
export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const { locale, t } = useI18n();
  const points = statusPoints(submission);
  const failure = failureDetail(submission, t);
  const resources = [
    { label: t("submissions.detail.time"), value: timeValue(submission.timeMs, locale) },
    { label: t("submissions.detail.memory"), value: memoryValue(submission.memoryKb, locale) },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="soj-panel soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid content-start gap-6">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <TypeExit href="/submissions" direction="back">
                {t("submissions.detail.back")}
              </TypeExit>
              <span className="font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt, locale)}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-soj-text md:text-[28px]">{t("submissions.detail.title", { id: submission.id })}</h1>
          </div>

          <StatGroup>
            {resources.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 ? <StatDivider /> : null}
                <Stat label={item.label} value={item.value} tone={index === 0 ? "accent" : "default"} />
              </Fragment>
            ))}
          </StatGroup>
        </div>

        <aside className="grid content-start gap-5 rounded-soj-lg border border-soj-line bg-soj-bg/45 p-5">
          <div className={cn("rounded-soj-md border px-3 py-3", verdictSurfaceClass(submission.status))}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("submissions.detail.verdict")}</p>
            <VerdictHeadline status={submission.status} className="mt-2 block text-3xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>{t("submissions.detail.problem")}</span>
              <strong>P{submission.problemId}</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("submissions.detail.route")}</span>
              <strong>{submission.contestId ? t("submissions.page.contest") : t("submissions.page.practice")}</strong>
            </div>
          </div>
          {failure ? <p className="border-t border-soj-line/60 pt-4 text-sm leading-6 text-soj-muted">{failure}</p> : null}
        </aside>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel aria-label={t("submissions.detail.testPointMatrix")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <h2 className="text-xl font-semibold">{t("submissions.detail.testPointMatrix")}</h2>
          {points.length > 0 ? <TestPointMatrix points={points} /> : <p className="text-sm leading-6 text-soj-muted">{t("submissions.detail.noCaseData")}</p>}
        </Panel>

        {submission.adminDiagnostics ? (
          <Panel aria-label={t("submissions.detail.diagnostics")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
            <h2 className="text-xl font-semibold">{t("submissions.detail.diagnostics")}</h2>
            <MetricFeed items={diagnosticItems(submission, t, locale)} />
          </Panel>
        ) : null}
      </div>

      {submission.contestId ? <SubmissionImpact submission={submission} /> : null}

      <SubmissionSourcePanel submissionId={submission.id} />
    </div>
  );
}

type SourceState = "loading" | "ready" | "unavailable";

function SubmissionSourcePanel({ submissionId }: { submissionId: number }) {
  const { t } = useI18n();
  const [state, setState] = useState<SourceState>("loading");
  const [sourceCode, setSourceCode] = useState("");

  useEffect(() => {
    let active = true;
    createBrowserApiClient()
      .submissions.source(submissionId)
      .then((result) => {
        if (!active) return;
        setSourceCode(result.sourceCode);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        // 403/401 是「没有权限」，不是故障：渲染成同一句可读的提示，而不是报错。
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setState("unavailable");
          return;
        }
        setState("unavailable");
      });
    return () => {
      active = false;
    };
  }, [submissionId]);

  return (
    <Panel aria-label={t("submissions.detail.source")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
      <h2 className="text-xl font-semibold">{t("submissions.detail.source")}</h2>
      {state === "loading" ? <p className="text-sm leading-6 text-soj-muted">{t("submissions.detail.sourceLoading")}</p> : null}
      {state === "unavailable" ? <p className="text-sm leading-6 text-soj-muted">{t("submissions.detail.sourceUnavailable")}</p> : null}
      {state === "ready" ? (
        <pre className="overflow-x-auto rounded-soj-md border border-soj-line bg-soj-bg/45 p-4 font-mono text-xs leading-6 text-soj-text">
          <code>{sourceCode}</code>
        </pre>
      ) : null}
    </Panel>
  );
}
