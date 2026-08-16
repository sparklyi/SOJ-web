"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "./status-pill";

type ContestClockProps = {
  label: string;
  value: string;
  frozen?: boolean;
};

export function ContestClock({ label, value, frozen = false }: ContestClockProps) {
  const { t } = useI18n();

  return (
    <div className="soj-contest-access p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-soj-muted">{label}</span>
        {frozen ? <StatusPill tone="warning">{t("status.frozen")}</StatusPill> : <StatusPill tone="accent">{t("status.live")}</StatusPill>}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-soj-text">{value}</div>
    </div>
  );
}
