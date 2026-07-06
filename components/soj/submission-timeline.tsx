import type { JudgeStatus } from "@/lib/api/types";
import { VerdictBadge } from "./verdict-badge";

type SubmissionTimelineItem = {
  id: string;
  status: JudgeStatus;
  label: string;
  timestamp?: string;
};

export function SubmissionTimeline({ items }: { items: SubmissionTimelineItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 py-3">
          <VerdictBadge status={item.status} />
          <span className="text-sm text-soj-text">{item.label}</span>
          {item.timestamp ? <time className="font-mono text-xs text-soj-muted">{item.timestamp}</time> : null}
        </li>
      ))}
    </ol>
  );
}
