"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { JudgeStatus } from "@/lib/api/types";
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

export function VerdictBadge({ status }: VerdictBadgeProps) {
  const { t } = useI18n();
  return <StatusPill tone={tones[status]}>{t(labels[status])}</StatusPill>;
}
