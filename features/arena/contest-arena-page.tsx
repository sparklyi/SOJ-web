import { ContestClock } from "@/components/soj/contest-clock";
import { RankMovement } from "@/components/soj/rank-movement";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SignalFeed } from "@/components/soj/signal-feed";
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
  const gridRows = scoreboard.rows.slice(0, 5).map((row) => ({
    id: row.id,
    rank: row.rank,
    handle: row.handle,
    solved: "solved" in row ? row.solved : undefined,
    penalty: "penalty" in row ? row.penalty : undefined,
    score: "score" in row ? row.score : undefined,
    movement: row.movement ?? 0,
  }));

  return (
    <div className="grid min-w-0 gap-5">
        <header className="grid gap-4 border-b border-soj-line pb-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusPill tone="accent">Arena</StatusPill>
              <StatusPill tone={contest.status === "frozen" ? "warning" : "accent"}>{contest.status}</StatusPill>
              <StatusPill tone={scoreboard.type === "acm" ? "info" : "warning"}>{scoreboard.type.toUpperCase()}</StatusPill>
            </div>
            <h2 className="text-5xl font-semibold tracking-tight md:text-7xl">Live board</h2>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-soj-muted">{contest.title} live board, submissions, accepted events, and score deltas.</p>
          </div>
          <ContestClock label="Freeze countdown" value={contest.status === "frozen" ? "00:00:00" : "00:47:18"} frozen={contest.status === "frozen"} />
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Top ranks</h2>
                <p className="mt-1 text-sm text-soj-muted">Big-screen ranking with movement visible at distance.</p>
              </div>
              {leader ? (
                <div className="text-right">
                  <div className="font-mono text-3xl text-soj-accent">#{leader.rank}</div>
                  <div className="text-sm text-soj-muted">{leader.handle}</div>
                </div>
              ) : null}
            </div>
            <div className="text-lg">
              <ScoreboardGrid rows={gridRows} mode={scoreboard.type} />
            </div>
          </div>

          <SignalFeed
            items={[
              { id: "movement", label: "Rank movement", value: "+2", tone: "accent" },
              { id: "accepted", label: "Accepted events", value: `${acceptedEvents.length}`, tone: "success" },
              { id: "delta", label: "Score deltas", value: scoreboard.type === "acm" ? "+1 solved" : "+40 pts", tone: "accent" },
              { id: "freeze", label: "Freeze status", value: contest.status === "frozen" ? "Active" : "Open", tone: contest.status === "frozen" ? "warning" : "accent" },
            ]}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ArenaEventPanel title="Key submissions" events={keyEvents} emptyLabel="No submissions yet" />
          <ArenaEventPanel title="Accepted events" events={acceptedEvents} emptyLabel="No accepted submissions yet" />
        </section>
    </div>
  );
}

function ArenaEventPanel({ title, events, emptyLabel }: { title: string; events: ArenaEvent[]; emptyLabel: string }) {
  return (
    <section className="rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      <div className="flex items-center justify-between gap-3 border-b border-soj-line px-4 py-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <StatusPill tone={events.length > 0 ? "accent" : "neutral"}>{events.length}</StatusPill>
      </div>
      {events.length > 0 ? (
        <ol className="divide-y divide-soj-line">
          {events.map((event) => (
            <li key={event.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4">
              <div>
                <div className="text-lg font-medium text-soj-text">{event.value}</div>
                <div className="mt-1 text-sm text-soj-muted">{event.label}</div>
              </div>
              <div className="grid justify-items-end gap-1">
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
