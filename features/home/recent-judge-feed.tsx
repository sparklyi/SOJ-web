import { SignalFeed } from "@/components/soj/signal-feed";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import type { SubmissionSummary } from "@/lib/api/types";

type RecentJudgeFeedProps = {
  submissions: SubmissionSummary[];
};

export function RecentJudgeFeed({ submissions }: RecentJudgeFeedProps) {
  return (
    <section aria-labelledby="recent-judge-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <h2 id="recent-judge-heading" className="text-xl font-semibold text-soj-text">
        Recent judge signals
      </h2>
      <div className="grid gap-3">
        {submissions.map((submission) => (
          <article key={submission.id} className="grid gap-3 border-b border-soj-line pb-3 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-soj-text">{submission.problemTitle}</h3>
              <VerdictBadge status={submission.status} />
            </div>
            <SignalFeed
              items={[
                { id: `${submission.id}-score`, label: "Score", value: `${submission.score}`, tone: submission.score > 0 ? "accent" : "neutral" },
                { id: `${submission.id}-time`, label: "Runtime", value: submission.timeMs ? `${submission.timeMs} ms` : "pending", tone: "neutral" },
              ]}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
