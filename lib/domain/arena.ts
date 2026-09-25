import type { SubmissionSummary } from "@/lib/api/types";
import { getSubmissionDisplayState, verdictLabel } from "./submission";

export type ArenaEventTone = "accent" | "success" | "warning" | "danger";

export type ArenaEvent = {
  id: string;
  /** 判定词的通用英文术语（Accepted / Wrong Answer…），不翻译。 */
  label: string;
  /** 事件主体（题目标题）。 */
  value: string;
  tone: ArenaEventTone;
  timestamp: string;
};

/**
 * 竞技场事件流。
 *
 * 这里以前会在最前面插一条「Contest status」事件：label 是硬编码的英文
 * （界面上直接出现 `Contest status`），value 是 `contest.status` 枚举
 * （于是又出现一个 `running`），而 timestamp 用的是 **contest.startsAt**
 * ——「最新评测」那一栏显示的时间因此是比赛开始的那一刻，不是任何一次提交。
 *
 * 比赛状态在页头有胶囊，不需要在这里再当一条事件。这里只产出提交事件。
 */
export function buildArenaEvents(submissions: SubmissionSummary[]): ArenaEvent[] {
  return submissions.slice(0, 8).map((submission) => {
    const state = getSubmissionDisplayState(submission.status);
    return {
      id: `submission-${submission.id}`,
      label: verdictLabel(submission.status),
      value: submission.problemTitle,
      tone: toArenaTone(state.tone),
      timestamp: submission.submittedAt,
    };
  });
}

function toArenaTone(tone: string): ArenaEventTone {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  if (tone === "danger") return "danger";
  return "accent";
}
