"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { VerdictHeadline, verdictSurfaceClass } from "@/components/soj/verdict-badge";
import { Panel } from "@/components/ui/panel";
import type { SubmissionSummary } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/translate";
import { cn } from "@/lib/ui/cn";
import { formatDuration, formatMemory } from "@/lib/ui/number";
import type { SubmissionState } from "./use-submission";

const dash = "—";

function failureLine(submission: SubmissionSummary, t: Translator): string | null {
  if (submission.errorMessage) return submission.errorMessage;
  const firstFailedCase = submission.result?.firstFailedCaseIndex;
  if (typeof firstFailedCase === "number") return t("submissions.detail.mismatch", { index: firstFailedCase });
  return null;
}

/**
 * 提交后的原地结果卡。
 *
 * 目的只有一个：让用户**不跳页**就拿到顶层答案——过没过、多久、多少内存、
 * 失败在哪。完整的测试点矩阵与源码在详情页，这里只放一句话的出口，
 * 不把详情页的版式搬进侧栏。
 */
export function SubmissionResultCard({
  state,
  onContinuePolling,
}: {
  state: SubmissionState;
  onContinuePolling: () => void;
}) {
  const { t, locale } = useI18n();

  if (state.status === "idle") return null;
  if (state.status === "pending") {
    return <p className="text-sm text-soj-muted">{t("problems.submitting")}</p>;
  }
  if (state.status === "error") {
    return <p className="text-sm text-soj-danger">{state.message}</p>;
  }

  const submission = state.submission;
  const time = typeof submission.timeMs === "number" ? formatDuration(submission.timeMs, locale) : dash;
  const memory = typeof submission.memoryKb === "number" ? formatMemory(submission.memoryKb, locale) : dash;
  const failure = failureLine(submission, t);

  return (
    <Panel className="grid gap-3 p-4" aria-live="polite">
      <div className={cn("flex items-center justify-between gap-3 rounded-soj-md border px-3 py-2.5", verdictSurfaceClass(submission.status))}>
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("submissions.detail.verdict")}</span>
        <VerdictHeadline status={submission.status} className="text-xl" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-soj-muted">
        <span>
          {t("submissions.detail.time")} {time}
        </span>
        <span>
          {t("submissions.detail.memory")} {memory}
        </span>
      </div>
      {failure ? <p className="text-sm leading-6 text-soj-muted">{failure}</p> : null}
      <div className="flex items-center justify-between gap-3">
        {state.status === "stillRunning" ? (
          <button type="button" onClick={onContinuePolling} className="font-mono text-xs text-soj-accent transition hover:opacity-80">
            {t("runs.continuePolling")}
          </button>
        ) : (
          <span />
        )}
        <LocalizedLink href={`/submissions/${submission.id}`} className="font-mono text-xs text-soj-accent transition hover:opacity-80">
          {t("problems.viewDetails")}
        </LocalizedLink>
      </div>
    </Panel>
  );
}
