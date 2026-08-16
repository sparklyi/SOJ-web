"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { JudgeStatus } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { VerdictBadge } from "./verdict-badge";

type SubmissionTimelineItem = {
  id: string;
  status: JudgeStatus;
  label: string;
  labelKey?: MessageKey;
  timestamp?: string;
};

export function SubmissionTimeline({ items }: { items: SubmissionTimelineItem[] }) {
  const { t } = useI18n();

  return (
    <ol className="soj-submission-timeline">
      {items.map((item, index) => (
        <li key={item.id} className="soj-submission-timeline-item">
          <span className="font-mono text-[11px] text-soj-muted">0{index + 1}</span>
          <VerdictBadge status={item.status} />
          <span className="text-sm text-soj-text">{item.labelKey ? t(item.labelKey) : item.label}</span>
          {item.timestamp ? <time className="font-mono text-xs text-soj-muted">{item.timestamp}</time> : null}
        </li>
      ))}
    </ol>
  );
}
