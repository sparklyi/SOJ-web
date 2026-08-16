"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemStatus as ProblemStatusValue } from "@/lib/api/types";
import { StatusPill } from "./status-pill";

const labels = {
  todo: "status.todo",
  attempted: "status.attempted",
  accepted: "status.solved",
} as const;

export function ProblemStatus({ status }: { status: ProblemStatusValue }) {
  const { t } = useI18n();
  return <StatusPill tone={status === "accepted" ? "success" : status === "attempted" ? "warning" : "neutral"}>{t(labels[status])}</StatusPill>;
}
