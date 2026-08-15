import { SignalFeed, type SignalFeedItem } from "@/components/soj/signal-feed";
import type { SubmissionSummary } from "@/lib/api/types";
import type { SubmissionTone } from "@/lib/domain/submission";

type SubmissionWithState = SubmissionSummary & {
  displayState: {
    tone: SubmissionTone;
    terminal: boolean;
  };
};

function buildImpactItems(submission: SubmissionWithState): SignalFeedItem[] {
  if (!submission.contestId) {
    return [
      { id: "scope", label: "Scope", value: "Practice run", tone: "neutral" },
      { id: "rank", label: "Rank movement", value: "None", tone: "neutral" },
    ];
  }

  const state = submission.status === "accepted" ? "Solved" : submission.displayState.terminal ? "Not solved" : "Not final";
  const stateTone = submission.status === "accepted" ? "success" : submission.displayState.terminal ? "danger" : "neutral";
  const penaltyLabel = submission.status === "accepted" ? "Penalty impact" : "Penalty status";
  return [
    { id: "contest", label: "Contest", value: submission.contestTitle ?? `Contest #${submission.contestId}`, tone: "accent" },
    { id: "state", label: "Accepted state", value: state, tone: stateTone },
    { id: "penalty", label: penaltyLabel, value: submission.contestImpact?.penalty ?? "Not provided by API", tone: submission.contestImpact?.penalty ? "warning" : "neutral" },
    { id: "rank", label: "Rank movement", value: submission.contestImpact?.rankMovement ?? "Not provided by API", tone: submission.contestImpact?.rankMovement ? "success" : "neutral" },
  ];
}

export function SubmissionImpact({ submission }: { submission: SubmissionWithState }) {
  return (
    <section aria-label="Contest impact signal" className="soj-submission-detail-panel grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
      <div>
        <h2 className="text-xl font-semibold">Contest impact signal</h2>
        <p className="mt-1 text-sm text-soj-muted">Rank, penalty, and contest state impact.</p>
      </div>
      <SignalFeed items={buildImpactItems(submission)} />
    </section>
  );
}
