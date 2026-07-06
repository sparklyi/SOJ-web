import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SplitWorkspaceProps = {
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
};

export function SplitWorkspace({ primary, secondary, className }: SplitWorkspaceProps) {
  return (
    <section className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]", className)}>
      <div className="min-w-0">{primary}</div>
      <aside className="min-w-0 border-t border-soj-line pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">{secondary}</aside>
    </section>
  );
}
