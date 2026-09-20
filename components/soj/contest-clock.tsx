"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";

type ContestClockProps = {
  label: string;
  value: string;
  frozen?: boolean;
};

/**
 * 比赛时钟。
 *
 * 旧形态是一张独立卡片，里面用 3xl 字号撑出一个孤立的数字，
 * 在首屏上占了近三分之一宽度却只表达一个状态。
 * 现在收成单行，挂在分区页头右侧。
 */
export function ContestClock({ label, value, frozen = false }: ContestClockProps) {
  const { t } = useI18n();

  return (
    <span className="flex items-center gap-2.5">
      <span className="text-xs text-soj-muted">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums text-soj-text">{value}</span>
      {frozen ? (
        <Badge tone="warning">{t("status.frozen")}</Badge>
      ) : (
        <Badge tone="accent" withDot>
          {t("status.live")}
        </Badge>
      )}
    </span>
  );
}
