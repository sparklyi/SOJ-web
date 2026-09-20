import { cn } from "@/lib/ui/cn";

export type MetricFeedItem = {
  id: string;
  label: string;
  value: string;
  tone?: "accent" | "success" | "warning" | "danger" | "neutral";
};

const toneClass: Record<NonNullable<MetricFeedItem["tone"]>, string> = {
  accent: "text-soj-accent",
  success: "text-soj-success",
  warning: "text-soj-warning",
  danger: "text-soj-danger",
  neutral: "text-soj-text",
};

/**
 * 键值指标流。
 *
 * 用 dl/dt/dd 而不是 div/span，这样读屏能听出「标签 — 数值」的配对关系。
 * 数值一律走等宽字体并继承 tabular-nums，保证多行之间逐位对齐。
 */
export function MetricFeed({ items, className }: { items: MetricFeedItem[]; className?: string }) {
  return (
    <dl className={cn("soj-feed", className)}>
      {items.map((item) => (
        <div key={item.id} className="soj-feed-row">
          <dt className="text-sm text-soj-muted">{item.label}</dt>
          <dd className={cn("font-mono text-sm tabular-nums", toneClass[item.tone ?? "neutral"])}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
