import type { JudgeStatus, SubmissionSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";

export type SubmissionTone = "neutral" | "info" | "accent" | "success" | "warning" | "danger";

export type SubmissionDisplayState = {
  status: JudgeStatus;
  /** 词条 key。这里曾经放的是英文原文（"Queued" / "Wrong Answer"…），
      于是中文界面上的竞技场事件流直接显出了 `Runtime Error`。 */
  labelKey: MessageKey;
  tone: SubmissionTone;
  terminal: boolean;
  order: number;
};

/** JudgeStatus → i18n key（`status.*`，见 lib/i18n/messages/system.ts）。词条的唯一出处。 */
export const judgeStatusLabelKey: Record<JudgeStatus, MessageKey> = {
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

const states: Record<JudgeStatus, Omit<SubmissionDisplayState, "status" | "labelKey">> = {
  queued: { tone: "neutral", terminal: false, order: 10 },
  compiling: { tone: "info", terminal: false, order: 20 },
  running: { tone: "accent", terminal: false, order: 30 },
  accepted: { tone: "success", terminal: true, order: 40 },
  wrong_answer: { tone: "danger", terminal: true, order: 40 },
  runtime_error: { tone: "danger", terminal: true, order: 40 },
  compile_error: { tone: "warning", terminal: true, order: 40 },
  time_limit: { tone: "warning", terminal: true, order: 40 },
  memory_limit: { tone: "warning", terminal: true, order: 40 },
  canceled: { tone: "neutral", terminal: true, order: 40 },
  system_error: { tone: "danger", terminal: true, order: 40 },
};

export function getSubmissionDisplayState(status: JudgeStatus): SubmissionDisplayState {
  return { status, labelKey: judgeStatusLabelKey[status], ...states[status] };
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
