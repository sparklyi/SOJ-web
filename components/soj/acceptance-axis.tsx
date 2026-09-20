import { cn } from "@/lib/ui/cn";
import { formatNumber } from "@/lib/ui/number";

type AcceptanceAxisProps = {
  /** 已按 0–100 计算的通过率。 */
  value: number;
  label: string;
  locale: string;
  className?: string;
};

/**
 * 通过率标尺。
 *
 * 页头里「通过率 34.2%」是一个孤立数字：读者知道它不高，但不知道「有多不高」。
 * 给它一条带 0% / 100% 端点与四分之一刻度的标尺，数字立刻变成「位置」——
 * 34.2% 落在第一格上沿，和 78% 是两个完全不同的难度含义。
 *
 * 填充用强调色而不是语义色：通过率低不等于出错，它表达的是「这道题筛掉了多少人」，
 * 属于品牌强调范围内的信息，不该借用红/绿这类结果色。
 */
export function AcceptanceAxis({ value, label, locale, className }: AcceptanceAxisProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="soj-eyebrow">{label}</span>
        <span className="font-mono text-xs tabular-nums text-soj-text">
          {formatNumber(clamped, { locale, decimals: 1 })}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tabular-nums text-soj-muted">0%</span>
        <span
          className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-soj-surface-2"
          role="img"
          aria-label={`${label}: ${formatNumber(clamped, { locale, decimals: 1 })}%`}
        >
          {/* 四分之一刻度：给填充长度一个可比对的参照，不然长条只表达「多 / 少」。
              刻度画在填充之上，于是它始终可见——被填充盖住的刻度等于没画。
              刻度用深色而不是浅色：它要同时落在「未填充的亮轨道」与「高亮的蓝填充」上，
              只有深色在两者上的对比都成立。 */}
          <span
            className="soj-grow-x relative block h-full rounded-full bg-soj-accent"
            style={{ width: `${clamped}%` }}
          />
          <span aria-hidden className="absolute inset-0 flex justify-between">
            {[0, 1, 2, 3, 4].map((tick) => (
              <span key={tick} className="h-full w-px bg-soj-bg/60" />
            ))}
          </span>
        </span>
        <span className="font-mono text-xs tabular-nums text-soj-muted">100%</span>
      </div>
    </div>
  );
}
