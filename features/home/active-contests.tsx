import Link from "next/link";
import { ContestClock } from "@/components/soj/contest-clock";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";

type ActiveContestsProps = {
  contests: ContestSummary[];
};

export function ActiveContests({ contests }: ActiveContestsProps) {
  const freeze = freezeDisplay(contests);

  return (
    <section aria-labelledby="active-contests-heading" className="grid gap-4">
      <div className="flex items-end justify-between gap-4 border-b border-soj-line pb-3">
        <h2 id="active-contests-heading" className="text-2xl font-semibold tracking-tight text-soj-text">
          Active contests
        </h2>
        <Link className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/contests">
          Contests
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="divide-y divide-soj-line rounded-soj-lg border border-soj-line bg-soj-bg-raised">
          {contests.length > 0 ? contests.map((contest) => (
            <article key={contest.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-soj-text">
                    <Link className="hover:text-soj-accent" href={`/contests/${contest.id}`}>
                      {contest.title}
                    </Link>
                  </h3>
                  <StatusPill tone={contest.status === "running" ? "accent" : "warning"}>{contest.status}</StatusPill>
                  <StatusPill tone="neutral">{contest.type.toUpperCase()}</StatusPill>
                </div>
                <p className="text-sm leading-6 text-soj-muted">{contest.problems.length} problems loaded for scoreboard and arena routes.</p>
              </div>
              <span className="self-start font-mono text-sm text-soj-accent">{contest.registered ? "registered" : "open"}</span>
            </article>
          )) : <p className="px-4 py-6 text-sm text-soj-muted">No active contests are available.</p>}
        </div>
        <ContestClock label={freeze.label} value={freeze.value} frozen={freeze.frozen} />
      </div>
    </section>
  );
}

function freezeDisplay(contests: ContestSummary[], now = Date.now()) {
  if (contests.some((contest) => contest.status === "frozen")) {
    return { label: "Scoreboard freeze", value: "Active", frozen: true };
  }

  const nextFreeze = contests
    .map((contest) => Date.parse(contest.freezeAt))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > now)
    .sort((a, b) => a - b)[0];

  if (!nextFreeze) return { label: "Next freeze", value: "Not scheduled", frozen: false };

  const totalSeconds = Math.max(0, Math.floor((nextFreeze - now) / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { label: "Next freeze", value: `${hours}:${minutes}:${seconds}`, frozen: false };
}
