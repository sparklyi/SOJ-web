import type { ContestSummary, SubmissionSummary } from "@/lib/api/types";
import { getSubmissionDisplayState } from "./submission";

export type ArenaEventTone = "accent" | "success" | "warning" | "danger";

export type ArenaEvent = {
  id: string;
  label: string;
  value: string;
  tone: ArenaEventTone;
  timestamp: string;
};

export function buildArenaEvents(contest: ContestSummary, submissions: SubmissionSummary[]): ArenaEvent[] {
  const submissionEvents = submissions.slice(0, 8).map((submission) => {
    const state = getSubmissionDisplayState(submission.status);
    return {
      id: `submission-${submission.id}`,
      label: state.label,
      value: submission.problemTitle,
      tone: toArenaTone(state.tone),
      timestamp: submission.submittedAt,
    };
  });

  return [
    {
      id: `contest-${contest.id}-status`,
      label: "Contest status",
      value: contest.status,
      tone: contest.status === "frozen" ? "warning" : "accent",
      timestamp: contest.startsAt,
    },
    ...submissionEvents,
  ];
}

function toArenaTone(tone: string): ArenaEventTone {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  return "accent";
}
