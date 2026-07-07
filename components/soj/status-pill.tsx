import { cn } from "@/lib/ui/cn";

type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<StatusTone, string> = {
  neutral: "border-soj-line bg-soj-surface text-soj-muted",
  accent: "border-soj-accent/50 bg-soj-accent/10 text-soj-accent",
  success: "border-soj-success/50 bg-soj-success/10 text-soj-success",
  warning: "border-soj-warning/50 bg-soj-warning/10 text-soj-warning",
  danger: "border-soj-danger/50 bg-soj-danger/10 text-soj-danger",
  info: "border-soj-info/50 bg-soj-info/10 text-soj-info",
};

type StatusPillProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusPill({ children, tone = "neutral", className }: StatusPillProps) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-soj-sm border px-2 py-1 font-mono text-xs", tones[tone], className)}>
      {children}
    </span>
  );
}
