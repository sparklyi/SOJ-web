"use client";

import type { JudgeStatus } from "@/lib/api/types";
import { verdictLabels } from "@/lib/domain/submission";
import { StatusPill } from "./status-pill";

type VerdictTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<JudgeStatus, VerdictTone> = {
  queued: "neutral",
  compiling: "info",
  running: "accent",
  accepted: "success",
  wrong_answer: "danger",
  runtime_error: "danger",
  compile_error: "warning",
  time_limit: "warning",
  memory_limit: "warning",
  output_limit: "warning",
  canceled: "neutral",
  system_error: "danger",
};

type VerdictBadgeProps = {
  status: JudgeStatus;
};

export function VerdictBadge({ status }: VerdictBadgeProps) {
  return <StatusPill tone={tones[status] ?? "neutral"}>{verdictLabels[status] ?? status}</StatusPill>;
}

const textTone: Record<VerdictTone, string> = {
  neutral: "text-soj-muted",
  accent: "text-soj-accent",
  success: "text-soj-success",
  warning: "text-soj-warning",
  danger: "text-soj-danger",
  info: "text-soj-info",
};

const surfaceTone: Record<VerdictTone, string> = {
  neutral: "border-soj-line bg-soj-bg/45",
  accent: "border-soj-accent/40 bg-soj-accent/10",
  success: "border-soj-success/40 bg-soj-success/10",
  warning: "border-soj-warning/40 bg-soj-warning/10",
  danger: "border-soj-danger/40 bg-soj-danger/10",
  info: "border-soj-info/40 bg-soj-info/10",
};

/**
 * 判定词的主视觉：大字号 + 按判定着色的文字（可外加一层同色调底板）。
 *
 * 之前详情页和原地结果卡都把结论写成 `text-soj-text` 的普通黑字，
 * 于是「通过」和「答案错误」看起来一样淡。判定是整页最重要的一个词，
 * 它应当自己带着颜色说话。
 */
export function VerdictHeadline({ status, className }: { status: JudgeStatus; className?: string }) {
  return <span className={`font-semibold ${textTone[tones[status] ?? "neutral"]} ${className ?? ""}`}>{verdictLabels[status] ?? status}</span>;
}

/** 与判定同色调的底板类，供结果卡/详情页把结论框起来。 */
export function verdictSurfaceClass(status: JudgeStatus): string {
  return surfaceTone[tones[status] ?? "neutral"];
}
