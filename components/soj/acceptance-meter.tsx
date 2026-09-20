import { cn } from "@/lib/ui/cn";
import { formatNumber } from "@/lib/ui/number";

type AcceptanceMeterProps = {
  /** 0–100 的通过率。 */
  value: number;
  locale: string;
  className?: string;
  /** 深色文字场景（例如放在面板标题栏里）传 muted。 */
  valueClassName?: string;
};

/**
 * 行内通过率柱。
 *
 * 版式是「条在前、数在后」，右端统一对齐——标准横向柱状图的读法：
 * 数值越大条越长，所以一列扫下来量级关系是免费的。
 *
 * 两个踩过的坑：
 *  1. 条不能放到数字下面。条比数字宽，左端会探出去一截，再加上轨道与面板同色，
 *     整列看起来是三条互不相干的下划线。
 *  2. 轨道必须可见。轨道和背景一样黑的时候，4.6% 的柱会被读成「这里没画东西」，
 *     而它其实表达的是「几乎没人过」——这是完全不同的信息。
 *
 * 颜色固定用中性冷银：难度列已经用彩色徽标表达过一次，
 * 同一行再上一次色会变成「一行两个信号」，反而更难读。
 */
export function AcceptanceMeter({ value, locale, className, valueClassName }: AcceptanceMeterProps) {
  const width = Math.max(2, Math.min(100, value));

  return (
    <div className={cn("flex items-center justify-end gap-2.5", className)}>
      <span aria-hidden className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-soj-surface-2">
        <span className="block h-full rounded-full bg-soj-silver/60" style={{ width: `${width}%` }} />
      </span>
      <span className={cn("w-12 text-right font-mono tabular-nums text-soj-text", valueClassName)}>
        {formatNumber(value, { locale, decimals: 1 })}%
      </span>
    </div>
  );
}
