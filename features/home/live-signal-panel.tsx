import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { getApiMode } from "@/lib/api/mode";
import type { ContestSummary, ProblemSummary, SubmissionSummary } from "@/lib/api/types";
import { getServerTranslator } from "@/lib/i18n/server";

type LiveSignalPanelProps = {
  contest?: ContestSummary;
  problem?: ProblemSummary;
  submission?: SubmissionSummary;
};

export async function LiveSignalPanel({ contest, problem, submission }: LiveSignalPanelProps) {
  const t = await getServerTranslator();
  const sourceLabel = t(getApiMode() === "http" ? "status.backendData" : "status.mockData");

  if (!contest || !problem || !submission) {
    return (
      <section aria-labelledby="live-signal-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 id="live-signal-heading" className="text-xl font-semibold text-soj-text">{t("home.liveSignalPanel")}</h2>
            <p className="max-w-2xl text-sm leading-6 text-soj-muted">{t("home.liveSignalsEmpty")}</p>
          </div>
          <StatusPill tone="neutral">{sourceLabel}</StatusPill>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="live-signal-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="live-signal-heading" className="text-xl font-semibold text-soj-text">{t("home.liveSignalPanel")}</h2>
          <p className="max-w-2xl text-sm leading-6 text-soj-muted">{t("home.liveSignalsDescription")}</p>
        </div>
        <VerdictBadge status={submission.status} />
      </div>
      <SignalFeed
        items={[
          { id: "phase", label: t("home.contestPhase"), value: contest.status, tone: contest.status === "running" ? "accent" : "warning" },
          { id: "route", label: t("home.problemRoute"), value: problem.title, tone: "neutral" },
          { id: "judge", label: t("home.judgeSignal"), value: submission.problemTitle, tone: submission.status === "accepted" ? "success" : "warning" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <StatusPill tone="accent">{t("home.rankMovement")}</StatusPill>
        <StatusPill tone="warning">{t("home.freezeCountdown")}</StatusPill>
        <StatusPill tone="neutral">{sourceLabel}</StatusPill>
      </div>
    </section>
  );
}
