import { cn } from "@/lib/ui/cn";

export function RankMovement({ delta }: { delta: number }) {
  const label = delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <span className={cn("font-mono text-sm", delta > 0 ? "text-soj-accent" : delta < 0 ? "text-soj-danger" : "text-soj-muted")}>
      {label}
    </span>
  );
}
