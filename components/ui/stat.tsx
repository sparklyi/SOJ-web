import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * 紧凑指标。
 *
 * 旧实现把每个指标包成一张带边框的小卡片，一排五个就是五个框，
 * 形成典型的「仪表盘噪音」。指标的价值在于「标签 + 数字成列对齐」，
 * 所以这里去掉边框，只靠等宽数字与字重建立层级，由外层用分隔线分组。
 */
const toneClass = {
  default: "text-soj-text",
  accent: "text-soj-accent",
  success: "text-soj-success",
  warning: "text-soj-warning",
  danger: "text-soj-danger",
  info: "text-soj-info",
  faint: "text-soj-faint",
} as const;

type StatProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof toneClass;
  className?: string;
};

export function Stat({ label, value, hint, tone = "default", className }: StatProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {/* 标签字号与颜色对齐首页读数标签的规范（home-plinth.module.css .reading dt）：
          曾经是 10px + 全大写 + 最弱灰，读者「只能看到数字」看不到标签——
          标签比正文更需要对比度，因为读者没有上下文可以补。 */}
      <span className="font-mono text-[13px] leading-none text-soj-muted">{label}</span>
      <span className={cn("font-mono text-xl font-semibold leading-none tabular-nums", toneClass[tone])}>{value}</span>
      {hint ? <span className="text-xs leading-4 text-soj-muted">{hint}</span> : null}
    </div>
  );
}

/** 一行指标的分组容器：用竖线分隔，不画框。 */
export function StatGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-stretch gap-x-7 gap-y-4", className)}>{children}</div>;
}

export function StatDivider() {
  return <span aria-hidden className="w-px self-stretch bg-soj-line" />;
}
