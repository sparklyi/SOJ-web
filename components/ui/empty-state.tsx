import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * 空态。
 *
 * 契约要求「每个核心页面都要有设计过的空态」，但实际页面上经常出现
 * 内容是空的、边框还在的「空洞卡片」——这比不显示还糟。
 * 所有可能为空的分区都应落到这个组件上。
 */
type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 text-center",
        compact ? "px-4 py-7" : "px-6 py-12",
        className,
      )}
    >
      {Icon ? (
        <span className="grid h-9 w-9 place-items-center rounded-soj-md border border-soj-line bg-soj-surface text-soj-faint">
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      ) : null}
      <div className="grid gap-1">
        <p className="text-sm font-medium text-soj-text">{title}</p>
        {description ? <p className="max-w-sm text-xs leading-5 text-soj-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-0.5">{action}</div> : null}
    </div>
  );
}
