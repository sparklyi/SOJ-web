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
    <ol className="soj-submission-timeline">
      {items.map((item, index) => (
        <li key={item.id} className="soj-submission-timeline-item">
          <span className="font-mono text-[11px] text-soj-muted">0{index + 1}</span>
          <VerdictBadge status={item.status} />
          <span className="text-sm text-soj-text">{item.label}</span>
          {item.timestamp ? <time className="font-mono text-xs text-soj-muted">{item.timestamp}</time> : null}
        </li>
      ))}
    </ol>
  );
}
