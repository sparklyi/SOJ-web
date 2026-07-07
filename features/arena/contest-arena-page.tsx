import { RankMovement } from "@/components/soj/rank-movement";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";
import type { ArenaEvent } from "@/lib/domain/arena";
import type { ScoreboardModel } from "@/lib/domain/scoreboard";

type ContestArenaPageProps = {
  contest: ContestSummary;
  events: ArenaEvent[];
  scoreboard: ScoreboardModel;
};

export function ContestArenaPage({ contest, events, scoreboard }: ContestArenaPageProps) {
  const acceptedEvents = events.filter((event) => event.tone === "success");
  const keyEvents = events.slice(0, 5);
  const leader = scoreboard.rows[0];
  const topRows = scoreboard.rows.slice(0, 5);
  const frozen = contest.status === "frozen";
  const movementTotal = scoreboard.rows.reduce((sum, row) => sum + Math.abs(row.movement ?? 0), 0);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <section className="soj-arena-stage soj-enter min-h-[620px] p-5 md:p-7">
        <div className="relative z-[1] grid h-full gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="accent">Arena</StatusPill>
                <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? "Frozen" : "Live"}</StatusPill>
                <StatusPill tone={scoreboard.type === "acm" ? "info" : "warning"}>{scoreboard.type.toUpperCase()}</StatusPill>
              </div>
              <h1 className="mt-5 text-6xl font-semibold leading-none tracking-tight md:text-8xl">Live board</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-soj-muted">{contest.title} broadcast view for rank movement, accepted events, and score deltas.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-end">
              <div className="soj-arena-leader p-5">
                <span className="text-sm text-soj-muted">Leader signal</span>
                <div className="mt-4 font-mono text-8xl font-semibold leading-none text-soj-accent">{leader?.rank ?? "-"}</div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold text-soj-text">{leader?.handle ?? "No rank"}</div>
                  {leader ? <RankMovement delta={leader.movement ?? 0} /> : null}
                </div>
              </div>
              <div className="soj-arena-track">
                {topRows.map((row) => (
                  <TopRankLane key={row.id} row={row} mode={scoreboard.type} />
                ))}
              </div>
            </div>
          </div>

          <aside className="grid content-between gap-4">
            <div className="soj-arena-clock p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-soj-muted">Freeze countdown</span>
                <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? "Active" : "Open"}</StatusPill>
              </div>
              <div className="mt-5 font-mono text-6xl font-semibold leading-none tracking-tight text-soj-text">{frozen ? "00:00:00" : "00:47:18"}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ArenaMetric label="Movement" value={String(movementTotal)} tone={movementTotal > 0 ? "accent" : "muted"} />
              <ArenaMetric label="Accepted" value={String(acceptedEvents.length)} tone="success" />
              <ArenaMetric label="Teams" value={String(scoreboard.rows.length)} />
              <ArenaMetric label="Mode" value={scoreboard.type.toUpperCase()} tone={scoreboard.type === "acm" ? "text" : "warning"} />
            </div>
            <ArenaTicker events={keyEvents} />
          </aside>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ArenaEventPanel title="Key submissions" events={keyEvents} emptyLabel="No submissions yet" />
        <ArenaEventPanel title="Accepted events" events={acceptedEvents} emptyLabel="No accepted submissions yet" />
      </section>
    </div>
  );
}

function TopRankLane({ row, mode }: { row: ScoreboardModel["rows"][number]; mode: ScoreboardModel["type"] }) {
  return (
    <div className="soj-arena-rank-lane">
      <div className="grid h-12 w-12 place-items-center rounded-[16px_4px_12px_4px] border border-soj-accent/45 bg-soj-accent/12 font-mono text-2xl text-soj-accent">
        {row.rank}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold text-soj-text">{row.handle}</div>
        <div className="mt-1 font-mono text-xs text-soj-muted">{row.id}</div>
      </div>
      <div className="justify-self-end text-right">
        <div className="font-mono text-2xl text-soj-accent">{"solved" in row ? row.solved : row.score}</div>
        <div className="text-xs text-soj-muted">{mode === "acm" ? "solved" : "score"}</div>
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
    <div className="rounded-soj-md border border-soj-line/50 bg-soj-bg/24 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <div className="text-xs text-soj-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl ${toneClass}`}>{value}</div>
    </div>
  );
}

function ArenaTicker({ events }: { events: ArenaEvent[] }) {
  const latest = events[0];
  return (
    <div className="soj-arena-ticker p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-soj-muted">Latest signal</span>
        <span className="h-px w-20 soj-hairline" />
      </div>
      {latest ? (
        <div className="mt-4">
          <div className="text-2xl font-semibold text-soj-text">{latest.value}</div>
          <div className="mt-1 font-mono text-sm text-soj-accent">{latest.label}</div>
        </div>
      ) : (
        <div className="mt-4 text-sm text-soj-muted">No signal yet</div>
      )}
    </div>
  );
}

function ArenaEventPanel({ title, events, emptyLabel }: { title: string; events: ArenaEvent[]; emptyLabel: string }) {
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
                <div className="mt-1 text-sm text-soj-muted">{event.label}</div>
              </div>
              <div className="grid min-w-0 justify-items-end gap-1">
                <RankMovement delta={event.tone === "danger" ? -1 : 1} />
                <time className="font-mono text-xs text-soj-muted">{formatEventTime(event.timestamp)}</time>
              </div>
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
