import Link from "next/link";
import { StatusPill } from "@/components/soj/status-pill";
import { getContestDurationMinutes } from "@/lib/domain/contest";
import type { ContestStatus, ContestSummary, ContestType } from "@/lib/api/types";

type ContestListItem = ContestSummary & {
  canRegister: boolean;
  canSubmit: boolean;
};

type ContestListProps = {
  contests: ContestListItem[];
};

const statusView: Record<ContestStatus, { label: string; tone: React.ComponentProps<typeof StatusPill>["tone"]; signal: string }> = {
  scheduled: { label: "Scheduled", tone: "info", signal: "Registration open" },
  running: { label: "Running", tone: "accent", signal: "Live submissions" },
  frozen: { label: "Frozen", tone: "warning", signal: "Scoreboard hidden" },
  ended: { label: "Ended", tone: "neutral", signal: "Submissions closed" },
  unsealed: { label: "Unsealed", tone: "success", signal: "Final ranks public" },
};

const typeLabel: Record<ContestType, string> = {
  acm: "ACM",
  oi: "OI/IOI",
};

export function ContestList({ contests }: ContestListProps) {
  const liveCount = contests.filter((contest) => contest.status === "running" || contest.status === "frozen").length;
  const registeredCount = contests.filter((contest) => contest.registered).length;
  const featuredContest = contests.find((contest) => contest.status === "running" || contest.status === "frozen") ?? contests[0];
  const acmCount = contests.filter((contest) => contest.type === "acm").length;
  const oiCount = contests.filter((contest) => contest.type === "oi").length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {featuredContest ? (
        <section aria-label="Featured contest" className="soj-contest-stage soj-enter grid min-h-[430px] gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative z-[1] flex min-w-0 flex-col justify-between gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={statusView[featuredContest.status].tone}>{statusView[featuredContest.status].label}</StatusPill>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-soj-muted">{typeLabel[featuredContest.type]}</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none tracking-tight md:text-7xl">{featuredContest.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-soj-muted">
                Register for rounds, enter live contests, and jump into scoreboard or Arena when the match is open.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <div className="soj-contest-runway">
                <div className="soj-contest-sweep" />
                <div className="soj-contest-node soj-contest-node-live">
                  <span>START</span>
                </div>
                <div className="soj-contest-node soj-contest-node-freeze">
                  <span>FREEZE</span>
                </div>
                <div className="soj-contest-node soj-contest-node-rank">
                  <span>RANK</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-1">
                <ContestMetric label="Duration" value={formatDuration(getContestDurationMinutes(featuredContest))} />
                <ContestMetric label="Problems" value={String(featuredContest.problems.length)} />
              </dl>
            </div>
          </div>

          <aside className="relative z-[1] grid content-between gap-4">
            <div className="soj-contest-console p-4">
              <div className="border-b border-soj-line/55 pb-4">
                <h2 className="text-xl font-semibold text-soj-text">Contest access</h2>
                <p className="mt-2 text-sm leading-6 text-soj-muted">{statusView[featuredContest.status].signal}</p>
              </div>
              <div className="mt-4 grid gap-3">
                <ContestAction href={`/contests/${featuredContest.id}`} label={featuredContest.canRegister ? "Register" : "Open contest"} primary />
                <ContestAction href={`/contests/${featuredContest.id}/scoreboard`} label="Scoreboard" />
                <ContestAction href={`/contests/${featuredContest.id}/arena`} label="Arena" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ContestMetric label="Listed" value={String(contests.length)} />
              <ContestMetric label="Live" value={String(liveCount)} tone={liveCount > 0 ? "accent" : "muted"} />
              <ContestMetric label="Joined" value={String(registeredCount)} tone={registeredCount > 0 ? "success" : "muted"} />
            </div>
          </aside>
        </section>
      ) : null}

      <section aria-label="Contest format lanes" className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="soj-contest-format p-5">
          <h2 className="text-2xl font-semibold tracking-tight">Contest lanes</h2>
          <p className="mt-3 text-sm leading-6 text-soj-muted">ACM and OI/IOI rounds share one lobby, with separate scoring expectations.</p>
          <div className="mt-6 grid gap-3">
            <ContestFormat label="ACM" value={acmCount} description="Penalty-driven ranks" />
            <ContestFormat label="OI/IOI" value={oiCount} description="Score and partials" />
          </div>
        </div>

        <div className="soj-contest-manifest overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-soj-line/55 px-4 py-3">
            <h2 className="text-lg font-semibold">Contest manifest</h2>
            <span className="font-mono text-xs text-soj-muted">{contests.length} rounds</span>
          </div>
          <div className="grid">
            {contests.map((contest) => {
              const status = statusView[contest.status];
              return (
                <article key={contest.id} className="soj-contest-row grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_150px_150px_210px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/contests/${contest.id}`} className="text-xl font-semibold tracking-tight text-soj-text transition hover:text-soj-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent">
                        {contest.title}
                      </Link>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-soj-muted">{status.signal}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contest.problems.slice(0, 4).map((problem) => (
                        <span key={problem.alias} className="rounded-soj-sm border border-soj-line/50 bg-soj-bg/24 px-2 py-1 font-mono text-xs text-soj-muted">
                          {problem.alias}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ContestRowStat label="Format" value={typeLabel[contest.type]} />
                  <ContestRowStat label="Window" value={formatDuration(getContestDurationMinutes(contest))} />
                  <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
                    <ContestAction href={`/contests/${contest.id}`} label={contest.canRegister ? "Register" : "Open"} primary={contest.canRegister || contest.canSubmit} />
                    <ContestAction href={`/contests/${contest.id}/scoreboard`} label="Scoreboard" />
                    <ContestAction href={`/contests/${contest.id}/arena`} label="Arena" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function ContestMetric({ label, value, tone = "text" }: { label: string; value: string; tone?: "text" | "accent" | "success" | "muted" }) {
  const toneClass = {
    text: "text-soj-text",
    accent: "text-soj-accent",
    success: "text-soj-success",
    muted: "text-soj-muted",
  }[tone];

  return (
    <div className="rounded-soj-md border border-soj-line/50 bg-soj-bg/24 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <dt className="text-xs text-soj-muted">{label}</dt>
      <dd className={`mt-1 font-mono text-lg ${toneClass}`}>{value}</dd>
    </div>
  );
}

function ContestFormat({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[16px_6px_14px_6px] border border-soj-line/50 bg-soj-bg/22 p-3">
      <span className="grid h-11 w-11 place-items-center rounded-soj-md border border-soj-accent/35 bg-soj-accent/10 font-mono text-sm text-soj-accent">{value}</span>
      <span>
        <span className="block font-medium text-soj-text">{label}</span>
        <span className="block text-sm text-soj-muted">{description}</span>
      </span>
    </div>
  );
}

function ContestRowStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-l border-soj-line/55 pl-3">
      <span className="text-xs text-soj-muted">{label}</span>
      <span className="font-mono text-sm text-soj-text">{value}</span>
    </div>
  );
}

function ContestAction({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex min-h-9 items-center justify-center rounded-soj-md bg-soj-accent px-3 py-2 text-sm font-semibold text-black shadow-[0_14px_34px_rgb(var(--soj-accent)/0.16)] transition hover:brightness-110 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
          : "inline-flex min-h-9 items-center justify-center rounded-soj-md border border-soj-line/55 bg-soj-bg/28 px-3 py-2 text-sm font-medium text-soj-muted transition hover:border-soj-accent/45 hover:text-soj-text active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
      }
    >
      {label}
    </Link>
  );
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "Unset";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
