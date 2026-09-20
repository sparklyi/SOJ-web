"use client";

import { Fragment } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { MetricFeed, type MetricFeedItem } from "@/components/soj/metric-feed";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { TypeExit } from "@/components/soj/type-exit";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import type { JudgeStatus, SubmissionSummary } from "@/lib/api/types";
import { buildSubmissionTimeline, type SubmissionTone } from "@/lib/domain/submission";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import type { getSubmission } from "./api";
import { SubmissionImpact } from "./submission-impact";

type SubmissionDetailProps = {
  submission: Awaited<ReturnType<typeof getSubmission>>;
};

const statusMessageKey: Record<JudgeStatus, MessageKey> = {
  queued: "status.queued",
  compiling: "status.compiling",
  running: "status.running",
  accepted: "status.accepted",
  wrong_answer: "status.wrongAnswer",
  runtime_error: "status.runtimeError",
  compile_error: "status.compileError",
  time_limit: "status.timeLimit",
  memory_limit: "status.memoryLimit",
  canceled: "status.canceled",
  system_error: "status.systemError",
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

function formatRuntime(value: number | undefined, t: Translator) {
  return typeof value === "number" ? `${value} ms` : t("submissions.value.pending");
}

function formatMemory(value: number | undefined, t: Translator) {
  return typeof value === "number" ? `${value} KB` : t("submissions.value.pending");
}

function contestLabel(submission: SubmissionSummary, t: Translator) {
  if (!submission.contestId) return t("submissions.page.practice");
  return submission.contestTitle ?? `Contest #${submission.contestId}`;
}

function verdictTone(tone: SubmissionTone): MetricFeedItem["tone"] {
  return tone === "info" ? "neutral" : tone;
}

function statusPoints(submission: SubmissionSummary) {
  return (submission.cases ?? []).map((testCase) => ({
    index: testCase.caseIndex,
    status: testCase.status,
    score: testCase.score,
  }));
}

function timelineItems(submission: SubmissionDetailProps["submission"], locale: string) {
  const time = formatSubmittedAt(submission.submittedAt, locale);
  return buildSubmissionTimeline(submission).map((state) => ({
    id: state.status,
    status: state.status,
    label: "",
    labelKey: statusMessageKey[state.status],
    timestamp: state.status === "queued" || state.terminal ? time : undefined,
  }));
}

function feedbackLine(submission: SubmissionSummary, t: Translator) {
  const firstFailedCase = submission.result?.firstFailedCaseIndex;
  if (submission.errorMessage) return submission.errorMessage;
  if (typeof firstFailedCase === "number") return t("submissions.detail.mismatch", { index: firstFailedCase });

  const lines: Record<JudgeStatus, MessageKey> = {
    queued: "submissions.feedback.queued",
    compiling: "submissions.feedback.compiling",
    running: "submissions.feedback.running",
    accepted: "submissions.feedback.accepted",
    wrong_answer: "submissions.feedback.wrongAnswer",
    runtime_error: "submissions.feedback.runtimeError",
    compile_error: "submissions.feedback.compileError",
    time_limit: "submissions.feedback.timeLimit",
    memory_limit: "submissions.feedback.memoryLimit",
    canceled: "submissions.feedback.canceled",
    system_error: "submissions.feedback.systemError",
  };
  return t(lines[submission.status]);
}

function runtimeItems(submission: SubmissionDetailProps["submission"], t: Translator): MetricFeedItem[] {
  const diagnostics = submission.adminDiagnostics;
  return [
    { id: "score", label: t("submissions.detail.score"), value: String(submission.score), tone: verdictTone(submission.displayState.tone) },
    { id: "time", label: t("submissions.detail.time"), value: formatRuntime(submission.timeMs, t), tone: "neutral" },
    { id: "memory", label: t("submissions.detail.memory"), value: formatMemory(submission.memoryKb, t), tone: "neutral" },
    {
      id: "compile",
      label: t("submissions.detail.compile"),
      value: submission.status === "compile_error" ? diagnostics?.compileOutputSummary ?? submission.errorMessage ?? t("submissions.value.failed") : t("submissions.value.ready"),
      tone: submission.status === "compile_error" ? "warning" : "success",
    },
    {
      id: "runtime",
      label: t("submissions.detail.runtime"),
      value: submission.status === "runtime_error" ? diagnostics?.stderrSummary ?? submission.errorMessage ?? t("submissions.value.aborted") : feedbackLine(submission, t),
      tone: submission.status === "runtime_error" ? "danger" : "neutral",
    },
    {
      id: "system",
      label: t("submissions.detail.system"),
      value: submission.status === "system_error" ? diagnostics?.errorMessage ?? submission.errorMessage ?? t("submissions.value.judgeError") : t("submissions.value.nominal"),
      tone: submission.status === "system_error" ? "danger" : "neutral",
    },
  ];
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const { locale, t } = useI18n();
  const points = statusPoints(submission);
  const resources = [
    { label: t("submissions.detail.score"), value: String(submission.score) },
    { label: t("submissions.detail.time"), value: formatRuntime(submission.timeMs, t) },
    { label: t("submissions.detail.memory"), value: formatMemory(submission.memoryKb, t) },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {/* 曾经是 soj-submission-detail-stage + soj-scanline 死类 + 两枚圆角胶囊
          + text-4xl/6xl 大标题 + 一段没有任何定义的装饰条（soj-submission-result-line）。
          现在就是一块普通面板：标题回到全站页头尺度，返回是排字出口，
          徽标是 Badge，指标是 Stat（不再一排小盒）。 */}
      <section className="soj-panel soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid content-start gap-6">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <TypeExit href="/submissions" direction="back">
                {t("submissions.detail.back")}
              </TypeExit>
              <Badge tone="accent">{t("submissions.detail.badge")}</Badge>
              <span className="font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt, locale)}</span>
            </div>
            <div className="grid gap-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-soj-text md:text-[28px]">{t("submissions.detail.title", { id: submission.id })}</h1>
              <p className="max-w-2xl text-sm leading-6 text-soj-muted">
                {t("submissions.detail.description", { problem: submission.problemTitle, contest: contestLabel(submission, t) })}
              </p>
            </div>
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("submissions.detail.verdict")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{t(statusMessageKey[submission.status])}</p>
            </div>
            <VerdictBadge status={submission.status} />
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
          <p className="border-t border-soj-line/60 pt-4 text-sm leading-6 text-soj-muted">{feedbackLine(submission, t)}</p>
        </aside>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel aria-label={t("submissions.detail.judgeLifecycle")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">{t("submissions.detail.judgeLifecycle")}</h2>
            <p className="mt-1 text-sm text-soj-muted">{t("submissions.detail.judgeLifecycleDescription")}</p>
          </div>
          <SubmissionTimeline items={timelineItems(submission, locale)} />
        </Panel>

        <Panel aria-label={t("submissions.detail.testPointMatrix")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">{t("submissions.detail.testPointMatrix")}</h2>
            <p className="mt-1 text-sm text-soj-muted">{t("submissions.detail.testPointDescription")}</p>
          </div>
          {points.length > 0 ? <TestPointMatrix points={points} /> : <p className="text-sm leading-6 text-soj-muted">{t("submissions.detail.noCaseData")}</p>}
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel aria-label={t("submissions.detail.runtimeSystem")} className="grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">{t("submissions.detail.runtimeSystem")}</h2>
            <p className="mt-1 text-sm text-soj-muted">{t("submissions.detail.runtimeSystemDescription")}</p>
          </div>
          <MetricFeed items={runtimeItems(submission, t)} />
        </Panel>
        <SubmissionImpact submission={submission} />
      </div>
    </div>
  );
}
