"use client";

import { ContestCountdown } from "@/components/soj/contest-countdown";
import { RankMovement } from "@/components/soj/rank-movement";
import { StatusPill } from "@/components/soj/status-pill";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ContestSummary } from "@/lib/api/types";
import type { ArenaEvent } from "@/lib/domain/arena";
import type { ScoreboardModel } from "@/lib/domain/scoreboard";
import type { Translator } from "@/lib/i18n/translate";

type ContestArenaPageProps = {
  contest: ContestSummary;
  events: ArenaEvent[];
  scoreboard: ScoreboardModel;
};

export function ContestArenaPage({ contest, events, scoreboard }: ContestArenaPageProps) {
  const { t } = useI18n();
  const acceptedEvents = events.filter((event) => event.tone === "success");
  const keyEvents = events.slice(0, 5);
  const leader = scoreboard.rows[0];
  const topRows = scoreboard.rows.slice(0, 5);
  const frozen = scoreboard.view === "frozen" || contest.status === "frozen";
  const movementTotal = scoreboard.rows.reduce((sum, row) => sum + Math.abs(row.movement ?? 0), 0);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      {/* 舞台曾经写死 min-h-[620px]，两栏再用 justify-between / content-between
          把内容推向上下两端：内容其实只有 480px，中间就被拉开一块贯穿左右两栏的空白。
          高度交给内容，留白自然出现在该出现的地方。 */}
      <section className="soj-arena-stage soj-enter p-5 md:p-7">
        <div className="relative z-[1] grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col gap-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="accent">{t("arena.label")}</StatusPill>
                <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? t("status.frozen") : t("status.live")}</StatusPill>
                <StatusPill tone={scoreboard.type === "acm" ? "info" : "warning"}>{scoreboard.type.toUpperCase()}</StatusPill>
              </div>
              <h1 className="mt-5 text-6xl font-semibold leading-none tracking-tight md:text-8xl">{t("arena.liveBoard")}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-soj-muted">{t("arena.broadcastDescription", { title: contest.title })}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
              <div className="soj-arena-leader p-5">
                <span className="text-sm text-soj-muted">{t("arena.leader")}</span>
                <div className="mt-4 font-mono text-8xl font-semibold leading-none text-soj-accent">{leader?.rank ?? "-"}</div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold text-soj-text">{leader?.handle ?? t("arena.noRank")}</div>
                  {leader ? <RankMovement delta={leader.movement ?? 0} /> : null}
                </div>
              </div>
              <div className="soj-arena-track">
                {topRows.map((row) => (
                  <TopRankLane key={row.id} row={row} mode={scoreboard.type} t={t} />
                ))}
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <div className="soj-arena-clock p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-soj-muted">{t("arena.freezeCountdown")}</span>
                <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? t("arena.active") : t("arena.open")}</StatusPill>
              </div>
              {/* 读数曾经是按状态二选一写死的两个常量（"00:00:00" / "00:47:18"）。 */}
              <ContestCountdown
                until={frozen ? contest.endsAt : contest.freezeAt}
                className="mt-5 block text-6xl font-semibold leading-none tracking-tight text-soj-text"
              />
            </div>
            {/* 「模式 ACM」曾经在这里又占一格，而页头已经有一枚 ACM 胶囊。 */}
            <div className="grid grid-cols-3 gap-3">
              <ArenaMetric label={t("arena.accepted")} value={String(acceptedEvents.length)} tone="success" />
              <ArenaMetric label={t("arena.teams")} value={String(scoreboard.rows.length)} />
              <ArenaMetric label={t("arena.movement")} value={String(movementTotal)} tone={movementTotal > 0 ? "accent" : "muted"} />
            </div>
            <ArenaTicker events={keyEvents} t={t} />
          </aside>
        </div>
      </section>

      {/* 两栏各自按自己的条数收高（items-start）。默认的 stretch 会把
          「通过事件」只有 1 条的那一栏拉到和左边一样高，下面留一大片空窗。 */}
      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ArenaEventPanel title={t("arena.keySubmissions")} events={keyEvents} emptyLabel={t("arena.noSubmissions")} t={t} />
        <ArenaEventPanel title={t("arena.acceptedEvents")} events={acceptedEvents} emptyLabel={t("arena.noSubmissions")} t={t} />
      </section>
    </div>
  );
}

function TopRankLane({ row, mode, t }: { row: ScoreboardModel["rows"][number]; mode: ScoreboardModel["type"]; t: Translator }) {
  return (
    <div className="soj-arena-rank-lane">
      <div className="grid h-12 w-12 place-items-center rounded-soj-md border border-soj-accent/45 bg-soj-accent/12 font-mono text-2xl text-soj-accent">
        {row.rank}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold text-soj-text">{row.handle}</div>
        <div className="mt-1 font-mono text-xs text-soj-muted">{row.id}</div>
      </div>
      <div className="justify-self-end text-right">
        <div className="font-mono text-2xl text-soj-accent">{"solved" in row ? row.solved : row.score}</div>
        <div className="text-xs text-soj-muted">{t(mode === "acm" ? "arena.solved" : "arena.score")}</div>
      </div>
      <RankMovement delta={row.movement ?? 0} />
    </div>
  );
}

function ArenaMetric({ label, value, tone = "text" }: { label: string; value: string; tone?: "text" | "accent" | "success" | "warning" | "muted" }) {
  const toneClass = {
    text: "text-soj-text",
    accent: "text-soj-accent",
    success: "text-soj-success",
    warning: "text-soj-warning",
    muted: "text-soj-muted",
  }[tone];

  return (
    <div className="soj-chip p-3">
      <div className="text-xs text-soj-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl ${toneClass}`}>{value}</div>
    </div>
  );
}

function ArenaTicker({ events, t }: { events: ArenaEvent[]; t: Translator }) {
  const latest = events[0];
  return (
    <div className="soj-arena-ticker p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-soj-muted">{t("arena.latestVerdict")}</span>
        <span className="h-px w-20 soj-hairline" />
      </div>
      {latest ? (
        <div className="mt-4">
          <div className="text-2xl font-semibold text-soj-text">{latest.value}</div>
          <div className="mt-1 font-mono text-sm text-soj-accent">{t(latest.labelKey)}</div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-soj-muted">{t("arena.noVerdict")}</div>
      )}
    </div>
  );
}

function ArenaEventPanel({ title, events, emptyLabel, t }: { title: string; events: ArenaEvent[]; emptyLabel: string; t: Translator }) {
  return (
    <section className="soj-arena-panel overflow-hidden">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-soj-line/55 px-4 py-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <StatusPill tone={events.length > 0 ? "accent" : "neutral"}>{events.length}</StatusPill>
      </div>
      {events.length > 0 ? (
        <ol className="divide-y divide-soj-line/55">
          {events.map((event) => (
            <li key={event.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-4 transition hover:bg-soj-surface/35">
              <div className="min-w-0">
                <div className="text-lg font-medium text-soj-text">{event.value}</div>
                <div className="mt-1 text-sm text-soj-muted">{t(event.labelKey)}</div>
              </div>
              {/* 这里曾经按 verdict 的 tone 现编一个排名变化（失败 -1、其余 +1）：
                  提交事件本身没有排名数据，编出来的箭头比没有箭头更糟。 */}
              <time className="self-start font-mono text-xs text-soj-muted">{formatEventTime(event.timestamp)}</time>
            </li>
          ))}
        </ol>
      ) : (
        <div className="px-4 py-8 text-sm text-soj-muted">{emptyLabel}</div>
      )}
    </section>
  );
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "00:00";
  return date.toISOString().slice(11, 16);
}
