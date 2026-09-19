import { Trophy } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { ContestClock } from "@/components/soj/contest-clock";
import { StatusPill } from "@/components/soj/status-pill";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { ContestSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";
import { cn } from "@/lib/ui/cn";

type ActiveContestsProps = {
  contests: ContestSummary[];
  /**
   * 这一栏要回答的是哪个问题。
   *
   * 首页把这一栏放在首屏正下方，因为比赛是全站唯一「错过就没有」的内容；
   * 但如果一场都没在进行，这块位置不能变成一个空盒子——那等于用最贵的版面
   * 宣告「本站无事发生」。所以没有进行中的比赛时切到 upcoming，
   * 改成回答「接下来有什么」，同一个组件、同一套行结构，只是换了时间语义。
   */
  mode?: "live" | "upcoming";
};

type FreezeDisplay = { labelKey: MessageKey; value: string; valueKey?: MessageKey; frozen: boolean };

/**
 * 比赛栏。
 *
 * 旧实现把每条比赛摊成一张大卡片，右侧再挂一张独立的时钟卡，
 * 三栏高度互不相同，首屏出现大片空洞。现在改为数据行：
 * 行高固定、信息左对齐、状态靠右成列，空态有兜底。
 *
 * 进行中的比赛，每行下面补一条**真实的比赛时间轴**：起点、终点，以及冻结时刻的刻度。
 * 这三个值本来就躺在接口数据里，画出来之后「现在进行到哪了」一眼可见。
 * 尚未开始的比赛画进度条没有意义（永远是 0），改为直接给出开始时刻。
 *
 * 刻度条是纯装饰性表达，因此对读屏隐藏。
 */
export async function ActiveContests({ contests, mode = "live" }: ActiveContestsProps) {
  const [t, locale] = await Promise.all([getServerTranslator(), getServerLocale()]);
  const freeze = freezeDisplay(contests);
  const now = currentTime();
  const isLive = mode === "live";

  return (
    <Panel variant="flush">
      <PanelHeader
        title={t(isLive ? "contest.active" : "contest.upcoming")}
        description={isLive ? undefined : t("contest.upcomingDescription")}
        action={
          <>
            {isLive ? (
              <ContestClock
                label={t(freeze.labelKey)}
                value={freeze.valueKey ? t(freeze.valueKey) : freeze.value}
                frozen={freeze.frozen}
              />
            ) : null}
            <LocalizedLink className="text-xs font-medium text-soj-accent hover:underline" href="/contests">
              {t("home.contests")}
            </LocalizedLink>
          </>
        }
      />

      {contests.length > 0 ? (
        <ul className="divide-y divide-soj-line">
          {contests.map((contest) => (
            <li
              key={contest.id}
              className="grid gap-2.5 px-4 py-3 transition-colors hover:bg-soj-surface/55"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <LocalizedLink
                    className="truncate text-sm font-medium text-soj-text transition-colors hover:text-soj-accent"
                    href={`/contests/${contest.id}`}
                  >
                    {contest.title}
                  </LocalizedLink>
                  <StatusPill tone={contest.status === "running" ? "accent" : "warning"}>
                    {t(contest.status === "running" ? "status.running" : "status.frozen")}
                  </StatusPill>
                  <StatusPill tone="neutral">{contest.type.toUpperCase()}</StatusPill>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden font-mono text-xs tabular-nums text-soj-faint sm:inline">
                    {t("contest.problemsLoaded", { count: contest.problems.length })}
                  </span>
                  {/* 「已报名 / 开放」是行内状态而不是链接：用中性标签承载，
                      避免强调色文字被读成可点击。已报名额外带一个状态点。 */}
                  <Badge tone="neutral" size="sm" withDot={contest.registered}>
                    {t(contest.registered ? "contest.registered" : "contest.open")}
                  </Badge>
                </div>
              </div>
              {isLive ? (
                <ContestWindowBar contest={contest} now={now} />
              ) : (
                <p className="font-mono text-xs text-soj-faint">
                  {t("contest.startsAt", { time: formatStartTime(contest.startsAt, locale) })}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact icon={Trophy} title={t("contest.noActive")} />
      )}
    </Panel>
  );
}

/** 比赛时间轴：填充部分表示已进行的比例，竖线是冻结时刻。 */
function ContestWindowBar({ contest, now }: { contest: ContestSummary; now: number }) {
  const start = Date.parse(contest.startsAt);
  const end = Date.parse(contest.endsAt);
  const freeze = Date.parse(contest.freezeAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const ratio = (value: number) => Math.min(100, Math.max(0, ((value - start) / (end - start)) * 100));
  const elapsed = ratio(now);
  const freezeAt = Number.isFinite(freeze) ? ratio(freeze) : null;

  return (
    <div aria-hidden className="relative h-1 w-full overflow-hidden rounded-full bg-soj-surface">
      <span
        className={cn(
          "soj-grow-x block h-full rounded-full",
          contest.status === "frozen" ? "bg-soj-warning/70" : "bg-soj-accent/70",
        )}
        style={{ width: `${Math.max(2, elapsed)}%` }}
      />
      {freezeAt !== null ? (
        <span className="absolute inset-y-0 w-px bg-soj-bg-raised" style={{ left: `${freezeAt}%` }} />
      ) : null}
    </div>
  );
}

/**
 * 开始时刻。
 *
 * 固定按 UTC 显示，和提交记录页的时间口径一致——
 * 站内同一个「时刻」不能出现两种时区解释，那比显示得不合本地习惯更糟。
 */
function formatStartTime(value: string, locale: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(timestamp);
}

/**
 * 读当前时刻。
 *
 * 收进模块级函数有两个原因：组件体内直接调用 Date.now() 会被 react-hooks/purity
 * 判为不纯（同一份 props 会渲染出不同结果）；集中到一处也便于日后统一替换成
 * 由服务端注入的时间，避免 SSR 与客户端各自读表。
 */
function currentTime() {
  return Date.now();
}

function freezeDisplay(contests: ContestSummary[], now = currentTime()): FreezeDisplay {
  if (contests.some((contest) => contest.status === "frozen")) {
    return { labelKey: "contest.scoreboardFreeze", value: "", valueKey: "contest.activeValue", frozen: true };
  }

  const nextFreeze = contests
    .map((contest) => Date.parse(contest.freezeAt))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > now)
    .sort((a, b) => a - b)[0];

  if (!nextFreeze) return { labelKey: "contest.nextFreeze", value: "", valueKey: "contest.notScheduled", frozen: false };

  const totalSeconds = Math.max(0, Math.floor((nextFreeze - now) / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { labelKey: "contest.nextFreeze", value: `${hours}:${minutes}:${seconds}`, frozen: false };
}
