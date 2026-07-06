import type { JudgeStatus } from "@/lib/api/types";
import { StatusPill } from "./status-pill";

const labels: Record<JudgeStatus, string> = {
  queued: "Queued",
  compiling: "Compiling",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compile_error: "Compile Error",
  system_error: "System Error",
};

const tones: Record<JudgeStatus, React.ComponentProps<typeof StatusPill>["tone"]> = {
  queued: "neutral",
  compiling: "info",
  running: "accent",
  accepted: "success",
  wrong_answer: "danger",
  runtime_error: "danger",
  compile_error: "warning",
  system_error: "danger",
};

type VerdictBadgeProps = {
  status: JudgeStatus;
};

export function VerdictBadge({ status }: VerdictBadgeProps) {
  return <StatusPill tone={tones[status]}>{labels[status]}</StatusPill>;
}
