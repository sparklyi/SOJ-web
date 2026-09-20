import { Badge } from "@/components/ui/badge";

type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

type StatusPillProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
  /** 表达「正在发生」时才加点，例如 running / frozen；纯静态状态不要加。 */
  withDot?: boolean;
};

/**
 * 兼容层：状态徽章的视觉统一由 components/ui/Badge 负责。
 * 保留此组件是为了不改动既有调用点，实现上不再自带一套色板。
 */
export function StatusPill({ children, tone = "neutral", className, withDot = false }: StatusPillProps) {
  return (
    <Badge tone={tone} className={className} withDot={withDot}>
      {children}
    </Badge>
  );
}
