import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Panel 是唯一的容器原语。
 *
 * 材质由 .soj-panel 提供（顶部受光的抬升面 + 1px 内高光），而不是靠投影堆厚度。
 * 标题栏与内容之间只用一条 1px 线切分，让层级来自「线 + 留白」，
 * 而不是「一屏七八个同质的圆角卡片」。
 */
const panelVariants = {
  default: "soj-panel",
  /** 内容自带内边距（表格、数据行列表），需要裁掉溢出。 */
  flush: "soj-panel overflow-hidden",
  /** 透明底，只保留描边：用于需要与背景连成一片的分区。 */
  plain: "rounded-soj-lg border border-soj-line",
} as const;

type PanelProps = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof panelVariants;
  /** 传入后 section 才会作为具名 region 暴露（无障碍导航与 e2e 都依赖）。 */
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function Panel({ children, className, variant = "default", ...rest }: PanelProps) {
  // 带上 aria-label 后 section 才会暴露为具名 region，
  // 这是无障碍导航（与 e2e 的 region 断言）都依赖的语义。
  return (
    <section className={cn(panelVariants[variant], className)} {...rest}>
      {children}
    </section>
  );
}

type PanelHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
};

export function PanelHeader({ title, description, action, className, headingLevel = "h2" }: PanelHeaderProps) {
  const Heading = headingLevel;

  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-soj-line px-4 py-3.5", className)}>
      <div className="grid min-w-0 gap-1">
        <Heading className="text-sm font-semibold tracking-tight text-soj-text">{title}</Heading>
        {description ? <p className="max-w-2xl text-xs leading-5 text-soj-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
}

export function PanelFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <footer className={cn("border-t border-soj-line px-4 py-2.5", className)}>{children}</footer>;
}
