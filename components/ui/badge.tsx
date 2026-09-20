import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Badge 是品牌里唯一的状态标签原语。
 *
 * 设计取向：低饱和底色 + 同色文字 + 1px 同色描边，不使用实心色块。
 * 实心色块在深色底上会形成一排高亮方块，是「报表难看」的主要来源；
 * 低饱和方案能承载同样的语义，同时让曜石蓝强调色保持唯一性。
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-soj-sm border font-mono leading-none",
  {
    variants: {
      tone: {
        neutral: "border-soj-line-strong bg-soj-surface text-soj-muted",
        accent: "border-soj-accent/40 bg-soj-accent/10 text-soj-accent",
        success: "border-soj-success/40 bg-soj-success/10 text-soj-success",
        warning: "border-soj-warning/40 bg-soj-warning/10 text-soj-warning",
        danger: "border-soj-danger/40 bg-soj-danger/10 text-soj-danger",
        info: "border-soj-info/40 bg-soj-info/10 text-soj-info",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
      },
      /** solid 仅用于「当前正在发生」的单一状态，全页面最多出现一次。 */
      emphasis: {
        soft: "",
        solid: "border-transparent",
      },
    },
    compoundVariants: [
      { tone: "accent", emphasis: "solid", class: "bg-soj-accent text-soj-bg" },
      { tone: "success", emphasis: "solid", class: "bg-soj-success text-soj-bg" },
      { tone: "warning", emphasis: "solid", class: "bg-soj-warning text-soj-bg" },
      { tone: "danger", emphasis: "solid", class: "bg-soj-danger text-soj-bg" },
      { tone: "info", emphasis: "solid", class: "bg-soj-info text-soj-bg" },
    ],
    defaultVariants: {
      tone: "neutral",
      size: "md",
      emphasis: "soft",
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: ReactNode;
  className?: string;
  /** 表达真实状态时才加点（纯装饰点会稀释信息密度）。 */
  withDot?: boolean;
  title?: string;
};

export function Badge({ children, className, tone, size, emphasis, withDot = false, title }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size, emphasis }), className)} title={title}>
      {withDot ? <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export { badgeVariants };
export type { BadgeProps };
