"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { useI18n } from "@/components/providers/i18n-provider";
import { getContestDurationMinutes } from "@/lib/domain/contest";
import type { ContestStatus, ContestSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import { cn } from "@/lib/ui/cn";

type ContestListItem = ContestSummary & {
  canRegister: boolean;
  canSubmit: boolean;
};

type ContestListProps = {
  contests: ContestListItem[];
};

const statusView: Record<ContestStatus, { label: MessageKey; tone: React.ComponentProps<typeof StatusPill>["tone"]; phase: MessageKey }> = {
  scheduled: { label: "contests.status.scheduled", tone: "info", phase: "contests.phase.registrationOpen" },
  running: { label: "contests.status.running", tone: "accent", phase: "contests.phase.liveSubmissions" },
  frozen: { label: "contests.status.frozen", tone: "warning", phase: "contests.phase.scoreboardHidden" },
  ended: { label: "contests.status.ended", tone: "neutral", phase: "contests.phase.submissionsClosed" },
  unsealed: { label: "contests.status.unsealed", tone: "success", phase: "contests.phase.finalRanksPublic" },
};

/**
 * 赛事列表。
 *
 * 三处删减，判断依据都是同一句：**这块内容属于谁**。
 *
 * 1. 焦点赛事的卡片里原先还放着「进行中 N 场」「已参加 N 场」——
 *    那是整页的聚合，却挂在一张只讲某一场比赛的卡片里。数字只要不描述卡片的主体，
 *    就一定会让人读错主语（「进行中 2」是这个比赛有 2 个环节，还是站里有 2 场比赛？）。
 *    现在卡片里只留描述这一场比赛的两个数字：时长、题目数。
 *
 * 2. 左边那栏「比赛类型」是一段 ACM / OI 规则说明——那是文档，不是界面。
 *    它对一个已经知道自己在打什么赛制的选手毫无用处，却占掉整整一列，
 *    把赛程表挤到 2/3 宽。赛制在每一行里已经标了（赛制 · ACM）。
 *
 * 3. 每一行原本有三个等权按钮（打开 / 排行榜 / 赛场），两行就是六个。
 *    进场是唯一的主操作，另外两个是查看入口，降为次级文字链接即可——
 *    三枚同样重的按钮并排，等于没有主次。
 */
export function ContestList({ contests }: ContestListProps) {
  const { t } = useI18n();
  const featuredContest = contests.find((contest) => contest.status === "running" || contest.status === "frozen") ?? contests[0];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {featuredContest ? (
        <section
          aria-label={t("contests.list.featured")}
          className="soj-panel soj-enter relative grid min-h-[300px] gap-6 overflow-hidden p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          {/* 曾经这里有全站第二处局部辉光（soj-glow）+ 右栏再套一层描边盒，
              一个焦点赛事等于三盏灯。首页改版定下的规矩是**一盏灯**：
              光是稀缺品，局部再点一盏，焦点就不在展品上了。
              网格也不单独画——整站环境层已经有一层，局部再叠一层会变成双线。 */}
          <div className="relative grid min-w-0 content-between gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={statusView[featuredContest.status].tone} withDot>
                  {t(statusView[featuredContest.status].label)}
                </StatusPill>
                <span className="soj-eyebrow">{t("status.acm")}</span>
                <span className="soj-eyebrow">{t(statusView[featuredContest.status].phase)}</span>
              </div>
              <h1 className="soj-display mt-5 max-w-4xl text-4xl md:text-6xl">{featuredContest.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-soj-muted">{t("contests.list.description")}</p>
            </div>

            <StatGroup>
              <Stat label={t("contests.metric.duration")} value={formatDuration(getContestDurationMinutes(featuredContest), t)} />
              <StatDivider />
              <Stat label={t("contests.metric.problems")} value={String(featuredContest.problems.length)} />
            </StatGroup>
          </div>

          {/* 右栏不再套描边盒：面板里再开一个盒，读起来是「盒子里的盒子」。 */}
          <aside className="relative grid content-start gap-3 self-start lg:border-l lg:border-soj-line lg:pl-6">
            <div className="border-b border-soj-line pb-3">
              <h2 className="text-sm font-semibold text-soj-text">{t("contests.list.access")}</h2>
              <p className="mt-1.5 text-xs leading-5 text-soj-muted">{t(statusView[featuredContest.status].phase)}</p>
            </div>
            <div className="mt-1 grid gap-3">
              <ContestAction
                href={`/contests/${featuredContest.id}`}
                label={featuredContest.canRegister ? t("contests.list.register") : t("contests.list.contest")}
                primary
              />
              <ContestSubLinks contestId={featuredContest.id} t={t} />
            </div>
          </aside>
        </section>
      ) : null}

      <Panel variant="flush">
        <PanelHeader
          title={t("contests.list.manifest")}
          action={<span className="font-mono text-xs text-soj-muted">{t("contests.list.rounds", { count: contests.length })}</span>}
        />
        <div className="grid">
          {contests.map((contest) => {
            const status = statusView[contest.status];
            return (
              <article
                key={contest.id}
                className="grid gap-4 px-4 py-4 transition-colors hover:bg-soj-surface/55 md:grid-cols-[minmax(0,1fr)_110px_120px_180px] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <LocalizedLink
                      href={`/contests/${contest.id}`}
                      className="text-lg font-semibold tracking-tight text-soj-text transition-colors hover:text-soj-accent"
                    >
                      {contest.title}
                    </LocalizedLink>
                    <StatusPill tone={status.tone}>{t(status.label)}</StatusPill>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-xs leading-5 text-soj-muted">{t(status.phase)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {contest.problems.slice(0, 4).map((problem) => (
                      <Badge key={problem.alias} tone="neutral" size="sm">
                        {problem.alias}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ContestRowStat label={t("contests.list.format")} value={t("status.acm")} />
                <ContestRowStat label={t("contests.list.window")} value={formatDuration(getContestDurationMinutes(contest), t)} />
                <div className="grid gap-2.5">
                  <ContestAction
                    href={`/contests/${contest.id}`}
                    label={contest.canRegister ? t("contests.list.register") : t("contests.list.open")}
                    primary={contest.canRegister || contest.canSubmit}
                  />
                  <ContestSubLinks contestId={contest.id} t={t} />
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/**
 * 查看入口。
 *
 * 排行榜与赛场是「去看」，不是「去做」，所以不再各占一枚按钮。
 * 一行文字链接既保住了入口，也让「进场」这件事重新成为唯一的主操作。
 */
function ContestSubLinks({ contestId, t }: { contestId: number; t: Translator }) {
  const linkClass = "font-mono text-xs text-soj-muted transition-colors hover:text-soj-text";

  return (
    <div className="flex items-center gap-2.5 font-mono text-xs">
      <LocalizedLink className={linkClass} href={`/contests/${contestId}/scoreboard`}>
        {t("contests.action.scoreboard")}
      </LocalizedLink>
      <span aria-hidden className="text-soj-line-strong">
        ·
      </span>
      <LocalizedLink className={linkClass} href={`/contests/${contestId}/arena`}>
        {t("contests.list.arena")}
      </LocalizedLink>
    </div>
  );
}

function ContestRowStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-l border-soj-line pl-3">
      <span className="soj-eyebrow">{label}</span>
      <span className="font-mono text-sm text-soj-text">{value}</span>
    </div>
  );
}

/**
 * 赛事入口按钮。
 *
 * primary 直接复用 buttonVariants 的金属变体，不再自己写
 * 「实心曜石蓝 + 彩色外发光」——那枚按钮此前是整页最响的元素，
 * 而它既不是实时状态也不是链接，属于纯粹的强调色超支。
 */
function ContestAction({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <LocalizedLink
      href={href}
      className={cn(buttonVariants({ variant: primary ? "solid" : "secondary", size: "md" }), "w-full")}
    >
      {label}
    </LocalizedLink>
  );
}

function formatDuration(minutes: number, t: Translator) {
  if (minutes <= 0) return t("contests.duration.unset");
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return t("contests.duration.minutes", { value: remainder });
  if (remainder === 0) return t("contests.duration.hours", { value: hours });
  return `${t("contests.duration.hours", { value: hours })} ${t("contests.duration.minutes", { value: remainder })}`;
}
