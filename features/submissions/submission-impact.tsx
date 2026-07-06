import { SignalFeed, type SignalFeedItem } from "@/components/soj/signal-feed";
import type { SubmissionSummary } from "@/lib/api/types";
import type { SubmissionTone } from "@/lib/domain/submission";

type SubmissionWithState = SubmissionSummary & {
  displayState: {
    tone: SubmissionTone;
  };
};

function signalTone(tone: SubmissionTone): SignalFeedItem["tone"] {
  return tone === "info" ? "neutral" : tone;
}

function buildImpactItems(submission: SubmissionWithState): SignalFeedItem[] {
  if (!submission.contestId) {
    return [
      { id: "scope", label: "Scope", value: "Practice run", tone: "neutral" },
      { id: "rank", label: "Rank movement", value: "None", tone: "neutral" },
    ];
  }

  if (submission.status === "accepted") {
    return [
      { id: "contest", label: "Contest", value: "SOJ Signal Cup", tone: "accent" },
      { id: "state", label: "Accepted state", value: "Solved", tone: "success" },
      { id: "penalty", label: "Penalty impact", value: "+42 min", tone: "warning" },
      { id: "rank", label: "Rank movement", value: "+2", tone: "success" },
    ];
  }

  if (submission.status === "wrong_answer") {
    return [
      { id: "contest", label: "Contest", value: "SOJ Signal Cup", tone: "accent" },
      { id: "state", label: "Accepted state", value: "Not solved", tone: "danger" },
      { id: "penalty", label: "Penalty risk", value: "+20 min", tone: "warning" },
      { id: "rank", label: "Rank movement", value: "Pending", tone: "neutral" },
    ];
  }

  if (submission.status === "compile_error") {
    return [
      { id: "contest", label: "Contest", value: "SOJ Signal Cup", tone: "accent" },
      { id: "state", label: "Accepted state", value: "No run", tone: "warning" },
      { id: "penalty", label: "Penalty impact", value: "No accepted penalty", tone: "neutral" },
      { id: "rank", label: "Rank movement", value: "None", tone: "neutral" },
    ];
  }

  if (submission.status === "runtime_error" || submission.status === "system_error") {
    return [
      { id: "contest", label: "Contest", value: "SOJ Signal Cup", tone: "accent" },
      { id: "state", label: "Accepted state", value: "Failed run", tone: "danger" },
      { id: "penalty", label: "Penalty risk", value: "+20 min", tone: "warning" },
      { id: "rank", label: "Rank movement", value: "None", tone: "neutral" },
    ];
  }

  return [
    { id: "contest", label: "Contest", value: "SOJ Signal Cup", tone: "accent" },
    { id: "state", label: "Judge state", value: submission.displayState.tone === "accent" ? "Running" : "Waiting", tone: signalTone(submission.displayState.tone) },
    { id: "penalty", label: "Penalty impact", value: "Not final", tone: "neutral" },
    { id: "rank", label: "Rank movement", value: "Not final", tone: "neutral" },
  ];
}

export function SubmissionImpact({ submission }: { submission: SubmissionWithState }) {
  return (
    <section aria-label="Contest impact signal" className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <h2 className="text-xl font-semibold">Contest impact signal</h2>
      <SignalFeed items={buildImpactItems(submission)} />
    </section>
  );
}
