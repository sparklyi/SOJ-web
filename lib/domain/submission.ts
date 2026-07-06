import type { JudgeStatus, SubmissionSummary } from "@/lib/api/types";

export type SubmissionTone = "neutral" | "info" | "accent" | "success" | "warning" | "danger";

export type SubmissionDisplayState = {
  status: JudgeStatus;
  label: string;
  tone: SubmissionTone;
  terminal: boolean;
  order: number;
};

const states: Record<JudgeStatus, Omit<SubmissionDisplayState, "status">> = {
  queued: { label: "Queued", tone: "neutral", terminal: false, order: 10 },
  compiling: { label: "Compiling", tone: "info", terminal: false, order: 20 },
  running: { label: "Running", tone: "accent", terminal: false, order: 30 },
  accepted: { label: "Accepted", tone: "success", terminal: true, order: 40 },
  wrong_answer: { label: "Wrong Answer", tone: "danger", terminal: true, order: 40 },
  runtime_error: { label: "Runtime Error", tone: "danger", terminal: true, order: 40 },
  compile_error: { label: "Compile Error", tone: "warning", terminal: true, order: 40 },
  system_error: { label: "System Error", tone: "danger", terminal: true, order: 40 },
};

export function getSubmissionDisplayState(status: JudgeStatus): SubmissionDisplayState {
  return { status, ...states[status] };
}

export function isSubmissionTerminal(status: JudgeStatus) {
  return states[status].terminal;
}

export function sortSubmissionsByNewest<T extends Pick<SubmissionSummary, "submittedAt" | "id">>(submissions: T[]) {
  return [...submissions].sort((a, b) => {
    const timeDelta = Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
    return timeDelta === 0 ? b.id - a.id : timeDelta;
  });
}

export function buildSubmissionTimeline(submission: SubmissionSummary) {
  const current = getSubmissionDisplayState(submission.status);
  const base = [
    getSubmissionDisplayState("queued"),
    ...(current.order >= 20 ? [getSubmissionDisplayState("compiling")] : []),
    ...(current.order >= 30 ? [getSubmissionDisplayState("running")] : []),
  ];

  if (current.terminal) {
    return [...base, current];
  }

  return base.filter((state) => state.order <= current.order);
}
