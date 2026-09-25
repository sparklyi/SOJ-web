import type { JudgeStatus, SubmissionSummary } from "@/lib/api/types";

export type SubmissionTone = "neutral" | "info" | "accent" | "success" | "warning" | "danger";

/**
 * 判定词是 OJ 圈的通用术语（Accepted / Wrong Answer / Time Limit Exceeded…），
 * 和变量名一样不随界面语言翻译。中英对照、截图传播、与评测机原始输出
 * 都对得上这一套词；翻成「通过」「答案错误」反而是第二套词汇。
 * 这里是它的唯一出处，徽标、原地结果卡、事件流都从这里取。
 */
export const verdictLabels: Record<JudgeStatus, string> = {
  queued: "Queued",
  compiling: "Compiling",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compile_error: "Compile Error",
  time_limit: "Time Limit Exceeded",
  memory_limit: "Memory Limit Exceeded",
  output_limit: "Output Limit Exceeded",
  canceled: "Canceled",
  system_error: "System Error",
};

export function verdictLabel(status: JudgeStatus): string {
  // 后端可能先于前端新增一个判定（`output_limit` 就是这样漏进来的）。
  // 未知值原样透出，而不是让页面在 `undefined.terminal` 上白屏。
  return verdictLabels[status] ?? status;
}

export type SubmissionDisplayState = {
  status: JudgeStatus;
  tone: SubmissionTone;
  terminal: boolean;
  order: number;
};

const states: Record<JudgeStatus, Omit<SubmissionDisplayState, "status">> = {
  queued: { tone: "neutral", terminal: false, order: 10 },
  compiling: { tone: "info", terminal: false, order: 20 },
  running: { tone: "accent", terminal: false, order: 30 },
  accepted: { tone: "success", terminal: true, order: 40 },
  wrong_answer: { tone: "danger", terminal: true, order: 40 },
  runtime_error: { tone: "danger", terminal: true, order: 40 },
  compile_error: { tone: "warning", terminal: true, order: 40 },
  time_limit: { tone: "warning", terminal: true, order: 40 },
  memory_limit: { tone: "warning", terminal: true, order: 40 },
  output_limit: { tone: "warning", terminal: true, order: 40 },
  canceled: { tone: "neutral", terminal: true, order: 40 },
  system_error: { tone: "danger", terminal: true, order: 40 },
};

/** 未知判定的兵底：当成终态，轮询停下来，用危险色引起注意。 */
const unknownState: Omit<SubmissionDisplayState, "status"> = { tone: "danger", terminal: true, order: 40 };

export function getSubmissionDisplayState(status: JudgeStatus): SubmissionDisplayState {
  return { status, ...(states[status] ?? unknownState) };
}

export function isSubmissionTerminal(status: JudgeStatus) {
  return (states[status] ?? unknownState).terminal;
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
