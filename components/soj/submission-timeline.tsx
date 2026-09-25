"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { JudgeStatus } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { VerdictBadge } from "./verdict-badge";
import { verdictLabel } from "@/lib/domain/submission";

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
      {items.map((item, index) => {
        // 徽标本身就写着状态词。若这一行的标签词与徽标同一个词，就不要再写一遍，
        // 否则一行会读成「排队中 排队中」；只有当标签是**另一句话**
        // （「正在运行测试点」「已进入评测队列」）时它才提供新信息。
        const label = item.labelKey ? t(item.labelKey) : item.label;
        const redundant = label === verdictLabel(item.status);

        return (
          <li key={item.id} className="soj-submission-timeline-item">
            <span className="font-mono text-xs text-soj-muted">0{index + 1}</span>
            <VerdictBadge status={item.status} />
            {redundant || !label ? null : <span className="text-sm text-soj-text">{label}</span>}
            {item.timestamp ? <time className="font-mono text-xs text-soj-muted">{item.timestamp}</time> : null}
          </li>
        );
      })}
    </ol>
  );
}
