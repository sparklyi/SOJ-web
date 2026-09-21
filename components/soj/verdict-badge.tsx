"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { JudgeStatus } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { StatusPill } from "./status-pill";

const labels = {
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
} as const;

const tones: Record<JudgeStatus, React.ComponentProps<typeof StatusPill>["tone"]> = {
  queued: "neutral",
  compiling: "info",
  running: "accent",
  accepted: "success",
  wrong_answer: "danger",
  runtime_error: "danger",
  compile_error: "warning",
  time_limit: "warning",
  memory_limit: "warning",
  canceled: "neutral",
  system_error: "danger",
};

type VerdictBadgeProps = {
  status: JudgeStatus;
};

/**
 * 徽标自己的词条。
 *
 * 导出的原因是「一句话里同一状态别说两遍」：时间线的每一行既有徽标（图标 + 词）
 * 又有一个文字标签，当那个标签**就是**徽标那个词时，一行里会读成
 * 「排队中 排队中」。调用点需要能判断「我要写的词与徽标是不是同一个」。
 */
export function verdictLabelKey(status: JudgeStatus): MessageKey {
  return labels[status];
}

export function VerdictBadge({ status }: VerdictBadgeProps) {
  const { t } = useI18n();
  return <StatusPill tone={tones[status]}>{t(labels[status])}</StatusPill>;
}
