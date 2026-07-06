import type { ContestStatus, ContestSummary } from "@/lib/api/types";

export type ContestPhase = "before_start" | "open" | "frozen" | "finished" | "unsealed";

const statusPhase: Record<ContestStatus, ContestPhase> = {
  scheduled: "before_start",
  running: "open",
  frozen: "frozen",
  ended: "finished",
  unsealed: "unsealed",
};

export function getContestPhase(contest: Pick<ContestSummary, "status">): ContestPhase {
  return statusPhase[contest.status];
}

export function canRegister(contest: Pick<ContestSummary, "status" | "registered">) {
  return !contest.registered && contest.status === "scheduled";
}

export function canSubmit(contest: Pick<ContestSummary, "status" | "registered">) {
  return contest.registered && (contest.status === "running" || contest.status === "frozen");
}

export function getContestDurationMinutes(contest: Pick<ContestSummary, "startsAt" | "endsAt">) {
  const start = Date.parse(contest.startsAt);
  const end = Date.parse(contest.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
}
