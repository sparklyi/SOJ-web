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
    <div className="soj-signal-feed">
      {items.map((item) => (
        <div key={item.id} className="soj-signal-feed-row">
          <span className="text-sm text-soj-muted">{item.label}</span>
          <span className={cn("font-mono text-sm", toneClass[item.tone ?? "neutral"])}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
