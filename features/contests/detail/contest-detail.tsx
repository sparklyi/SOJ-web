import Link from "next/link";
import { ContestClock } from "@/components/soj/contest-clock";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { getContestDurationMinutes } from "@/lib/domain/contest";
import type { ContestStatus, ContestSummary, ContestType } from "@/lib/api/types";
import { ContestProblemTable } from "./contest-problem-table";
import { ContestRegistration } from "./contest-registration";

type ContestDetailProps = {
  contest: ContestSummary & {
    canRegister: boolean;
    canSubmit: boolean;
  };
};

const statusView: Record<ContestStatus, { label: string; tone: React.ComponentProps<typeof StatusPill>["tone"]; clockLabel: string; clockValue: string }> = {
  scheduled: { label: "Scheduled", tone: "info", clockLabel: "Start window", clockValue: "Standby" },
  running: { label: "Running", tone: "accent", clockLabel: "Contest clock", clockValue: "Live" },
  frozen: { label: "Frozen", tone: "warning", clockLabel: "Scoreboard freeze", clockValue: "Active" },
  ended: { label: "Ended", tone: "neutral", clockLabel: "Contest clock", clockValue: "Closed" },
  unsealed: { label: "Unsealed", tone: "success", clockLabel: "Final state", clockValue: "Public" },
};

const typeLabel: Record<ContestType, string> = {
  acm: "ACM penalty",
  oi: "OI/IOI scoring",
};

export function ContestDetail({ contest }: ContestDetailProps) {
  const status = statusView[contest.status];
  const duration = getContestDurationMinutes(contest);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section aria-label="Contest lifecycle" className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
        <div className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <StatusPill tone="neutral">{typeLabel[contest.type]}</StatusPill>
            {contest.registered ? <StatusPill tone="success">Registered</StatusPill> : null}
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Contest control surface</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-soj-muted">
            Review lifecycle state, submit access, rules, problem aliases, and live display routes before entering the round.
          </p>
          <dl className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-soj-line pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-soj-muted">Starts</dt>
              <dd className="mt-1 font-mono text-sm text-soj-text">{formatDate(contest.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-soj-muted">Freeze</dt>
              <dd className="mt-1 font-mono text-sm text-soj-text">{formatDate(contest.freezeAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-soj-muted">Ends</dt>
              <dd className="mt-1 font-mono text-sm text-soj-text">{formatDate(contest.endsAt)}</dd>
            </div>
          </dl>
        </div>
        <ContestClock label={status.clockLabel} value={status.clockValue} frozen={contest.status === "frozen"} />
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <ContestRegistration contest={contest} />
        <SignalFeed
          items={[
            { id: "duration", label: "Contest duration", value: formatDuration(duration), tone: "neutral" },
            { id: "problems", label: "Problem aliases", value: String(contest.problems.length), tone: "accent" },
            { id: "submit", label: "Submit permission", value: contest.canSubmit ? "Open" : "Closed", tone: contest.canSubmit ? "success" : "warning" },
            { id: "scoreboard", label: "Scoreboard state", value: contest.status === "frozen" ? "Frozen" : "Visible", tone: contest.status === "frozen" ? "warning" : "neutral" },
          ]}
        />
      </div>

      <ContestProblemTable contest={contest} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <section aria-labelledby="contest-rules-heading" className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <h2 id="contest-rules-heading" className="text-xl font-semibold">Rules</h2>
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 text-sm leading-6 text-soj-muted">
            {buildRules(contest).map((rule) => (
              <li key={rule} className="border-l border-soj-line pl-3">{rule}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contest-announcements-heading" className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <h2 id="contest-announcements-heading" className="text-xl font-semibold">Announcements</h2>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4">
            {buildAnnouncements(contest).map((item) => (
              <article key={item.title} className="border-b border-soj-line pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-medium text-soj-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-soj-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section aria-label="Contest routes" className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Live routes</h2>
          <p className="mt-2 text-sm leading-6 text-soj-muted">Use the scoreboard for ranked analysis and Arena for public display mode.</p>
        </div>
        <Link href={`/contests/${contest.id}/scoreboard`} className="font-medium text-soj-accent transition hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent">
          Scoreboard
        </Link>
        <Link href={`/contests/${contest.id}/arena`} className="font-medium text-soj-accent transition hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent">
          Arena
        </Link>
      </section>
    </div>
  );
}

function buildRules(contest: ContestSummary) {
  if (contest.type === "acm") {
    return [
      "Accepted problems add one solve and rejected attempts before acceptance add penalty.",
      "The scoreboard may freeze before the final hour while submissions continue.",
      "Only registered participants can submit during the live contest window.",
    ];
  }

  return [
    "Each problem can award partial score based on accepted subtasks and test groups.",
    "The highest valid score per problem contributes to the total score.",
    "Only registered participants can submit during the live contest window.",
  ];
}

function buildAnnouncements(contest: ContestSummary) {
  const freezeAnnouncement =
    contest.status === "frozen"
      ? {
          title: "Scoreboard freeze is active",
          body: "Public rank movement is hidden until the final reveal. Submissions are still evaluated.",
        }
      : {
          title: "Contest signal is stable",
          body: "Problem statements, scoreboard route, and Arena route are available from this page.",
        };

  return [
    freezeAnnouncement,
    {
      title: "Permission hint",
      body: contest.registered
        ? "Your account is registered for this contest. Submit access follows the lifecycle state."
        : "This account is not registered. Register while the scheduled window is open.",
    },
  ];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "Unset";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
