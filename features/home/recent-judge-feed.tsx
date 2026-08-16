import { SignalFeed } from "@/components/soj/signal-feed";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import type { SubmissionSummary } from "@/lib/api/types";
import { getServerTranslator } from "@/lib/i18n/server";

type RecentJudgeFeedProps = {
  submissions: SubmissionSummary[];
};

export async function RecentJudgeFeed({ submissions }: RecentJudgeFeedProps) {
  const t = await getServerTranslator();

  return (
    <section aria-labelledby="recent-judge-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <h2 id="recent-judge-heading" className="text-xl font-semibold text-soj-text">{t("home.recentJudgeSignals")}</h2>
      <div className="grid gap-3">
        {submissions.length > 0 ? submissions.map((submission) => (
          <article key={submission.id} className="grid gap-3 border-b border-soj-line pb-3 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-soj-text">{submission.problemTitle}</h3>
              <VerdictBadge status={submission.status} />
            </div>
            <SignalFeed
              items={[
                { id: `${submission.id}-score`, label: t("home.score"), value: `${submission.score}`, tone: submission.score > 0 ? "accent" : "neutral" },
                { id: `${submission.id}-time`, label: t("home.runtime"), value: submission.timeMs ? `${submission.timeMs} ms` : t("home.pending"), tone: "neutral" },
              ]}
            />
          </article>
        )) : <p className="text-sm text-soj-muted">{t("home.noJudgeSignals")}</p>}
      </div>
    </section>
  );
}
