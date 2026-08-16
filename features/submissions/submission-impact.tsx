import { SignalFeed, type SignalFeedItem } from "@/components/soj/signal-feed";
import { useI18n } from "@/components/providers/i18n-provider";
import type { SubmissionSummary } from "@/lib/api/types";
import type { SubmissionTone } from "@/lib/domain/submission";
import type { Translator } from "@/lib/i18n/translate";

type SubmissionWithState = SubmissionSummary & {
  displayState: {
    tone: SubmissionTone;
    terminal: boolean;
  };
};

function buildImpactItems(submission: SubmissionWithState, t: Translator): SignalFeedItem[] {
  if (!submission.contestId) {
    return [
      { id: "scope", label: t("submissions.impact.scope"), value: t("submissions.impact.practiceRun"), tone: "neutral" },
      { id: "rank", label: t("submissions.impact.rankMovement"), value: t("submissions.impact.none"), tone: "neutral" },
    ];
  }

  const state = submission.status === "accepted" ? t("submissions.impact.solved") : submission.displayState.terminal ? t("submissions.impact.notSolved") : t("submissions.impact.notFinal");
  const stateTone = submission.status === "accepted" ? "success" : submission.displayState.terminal ? "danger" : "neutral";
  const penaltyLabel = submission.contestImpact?.penalty
    ? submission.status === "accepted"
      ? t("submissions.impact.penaltyImpact")
      : t("submissions.impact.penaltyRisk")
    : t("submissions.impact.penaltyStatus");
  return [
    { id: "contest", label: t("submissions.page.contest"), value: submission.contestTitle ?? `Contest #${submission.contestId}`, tone: "accent" },
    { id: "state", label: t("submissions.impact.acceptedState"), value: state, tone: stateTone },
    { id: "penalty", label: penaltyLabel, value: submission.contestImpact?.penalty ?? t("submissions.value.notProvided"), tone: submission.contestImpact?.penalty ? "warning" : "neutral" },
    { id: "rank", label: t("submissions.impact.rankMovement"), value: submission.contestImpact?.rankMovement ?? t("submissions.value.notProvided"), tone: submission.contestImpact?.rankMovement ? "success" : "neutral" },
  ];
}

export function SubmissionImpact({ submission }: { submission: SubmissionWithState }) {
  const { t } = useI18n();

  return (
    <section aria-label={t("submissions.impact.ariaLabel")} className="soj-submission-detail-panel grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">{t("submissions.impact.title")}</h2>
        <p className="mt-1 text-sm text-soj-muted">{t("submissions.impact.description")}</p>
      </div>
      <SignalFeed items={buildImpactItems(submission, t)} />
    </section>
  );
}
