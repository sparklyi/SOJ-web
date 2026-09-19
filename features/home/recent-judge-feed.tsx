import { Inbox } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { SubmissionSummary } from "@/lib/api/types";
import { getServerTranslator } from "@/lib/i18n/server";
import { cn } from "@/lib/ui/cn";

type RecentJudgeFeedProps = {
  submissions: SubmissionSummary[];
};

/** 左缘色条：让每条记录的裁决在扫视时先被看到，不必读文字。 */
const railTone: Record<string, string> = {
  accepted: "bg-soj-success",
  wrong_answer: "bg-soj-danger",
  time_limit_exceeded: "bg-soj-warning",
  memory_limit_exceeded: "bg-soj-warning",
  runtime_error: "bg-soj-danger",
  compile_error: "bg-soj-danger",
};

/**
 * 最近评测。
 *
 * 旧实现每条提交是一张卡，卡内再嵌一张两行信号表，三条就吃掉半屏。
 * 现在压成数据行：左缘一条 2px 裁决色条，题名靠左，分数与耗时靠右成列。
 */
export async function RecentJudgeFeed({ submissions }: RecentJudgeFeedProps) {
  const t = await getServerTranslator();

  return (
    <Panel variant="flush" aria-label={t("home.recentVerdicts")}>
      <PanelHeader
        title={t("home.recentVerdicts")}
        description={t("home.recentVerdictsDescription")}
        action={
          <LocalizedLink className="text-xs font-medium text-soj-accent hover:underline" href="/submissions">
            {t("home.allVerdicts")}
          </LocalizedLink>
        }
      />

      {submissions.length > 0 ? (
        <ul className="divide-y divide-soj-line">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-soj-surface/55"
            >
              <span
                aria-hidden
                className={cn("absolute inset-y-2 left-0 w-px", railTone[submission.status] ?? "bg-soj-line-strong")}
              />
              <LocalizedLink
                className="truncate text-sm text-soj-text transition-colors hover:text-soj-accent"
                href={`/submissions/${submission.id}`}
              >
                {submission.problemTitle}
              </LocalizedLink>
              <div className="flex shrink-0 items-center gap-4">
                {/* 得分只在真正拿到分时才显示：给一条编译错误标一个「得分 0」，
                    是在用一排零填满右半边，读者还得逐个确认「这个零有没有意义」。 */}
                {submission.score > 0 ? (
                  <span className="hidden font-mono text-xs tabular-nums text-soj-muted sm:inline">
                    {t("home.score")} {submission.score}
                  </span>
                ) : null}
                <span className="hidden font-mono text-xs tabular-nums text-soj-faint md:inline">
                  {submission.timeMs ? `${submission.timeMs} ms` : t("home.pending")}
                </span>
                <VerdictBadge status={submission.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact icon={Inbox} title={t("home.noVerdicts")} />
      )}
    </Panel>
  );
}
