import { cn } from "@/lib/ui/cn";

export type SignalFeedItem = {
  id: string;
  label: string;
  value: string;
  tone?: "accent" | "success" | "warning" | "danger" | "neutral";
};

const toneClass: Record<NonNullable<SignalFeedItem["tone"]>, string> = {
  accent: "text-soj-accent",
  success: "text-soj-success",
  warning: "text-soj-warning",
  danger: "text-soj-danger",
  neutral: "text-soj-muted",
};

export function SignalFeed({ items }: { items: SignalFeedItem[] }) {
  return (
    <div className="divide-y divide-soj-line rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3">
          <span className="text-sm text-soj-muted">{item.label}</span>
          <span className={cn("font-mono text-sm", toneClass[item.tone ?? "neutral"])}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
