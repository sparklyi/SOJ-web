import Link from "next/link";
import { ContestClock } from "@/components/soj/contest-clock";
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
  const firstProblemId = contest.problems[0]?.problemId;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section aria-label="Contest command" className="soj-contest-detail-stage soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative z-[1] flex min-w-0 flex-col justify-between gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={status.tone}>{status.label}</StatusPill>
              <StatusPill tone="neutral">{typeLabel[contest.type]}</StatusPill>
              {contest.registered ? <StatusPill tone="success">Registered</StatusPill> : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none tracking-tight md:text-7xl">{contest.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-soj-muted">
              Check access, open contest problems, and monitor scoreboard state before entering the round.
            </p>
            <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <SchedulePoint label="Starts" value={formatDate(contest.startsAt)} />
              <SchedulePoint label="Freeze" value={formatDate(contest.freezeAt)} />
              <SchedulePoint label="Ends" value={formatDate(contest.endsAt)} />
            </dl>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="soj-contest-timeline">
              <span className="soj-contest-mark soj-contest-mark-start">START</span>
              <span className="soj-contest-mark soj-contest-mark-freeze">FREEZE</span>
              <span className="soj-contest-mark soj-contest-mark-end">END</span>
            </div>
            <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <ContestMetric label="Duration" value={formatDuration(duration)} />
              <ContestMetric label="Problems" value={String(contest.problems.length)} tone="accent" />
              <ContestMetric label="Submit" value={contest.canSubmit ? "Open" : "Closed"} tone={contest.canSubmit ? "success" : "muted"} />
            </dl>
          </div>
        </div>

        <aside className="relative z-[1] grid content-between gap-4">
          <ContestClock label={status.clockLabel} value={status.clockValue} frozen={contest.status === "frozen"} />
          <ContestRegistration contest={contest} />
          <div className="grid grid-cols-2 gap-3">
            <RouteAction href={`/contests/${contest.id}/scoreboard`} label="Scoreboard" />
            <RouteAction href={`/contests/${contest.id}/arena`} label="Arena" />
            {firstProblemId ? <RouteAction href={`/contests/${contest.id}/problems/${firstProblemId}`} label="First problem" primary /> : null}
          </div>
        </aside>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-6">
          <ContestProblemTable contest={contest} />
          <section aria-labelledby="contest-rules-heading" className="soj-contest-brief p-5 md:p-6">
            <h2 id="contest-rules-heading" className="text-2xl font-semibold tracking-tight">Rules</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-soj-muted">
              {buildRules(contest).map((rule) => (
                <li key={rule} className="border-l border-soj-accent/35 pl-3">{rule}</li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="contest-announcements-heading" className="soj-contest-brief sticky top-24 p-5">
          <h2 id="contest-announcements-heading" className="text-2xl font-semibold tracking-tight">Announcements</h2>
          <div className="mt-5 grid gap-4">
            {buildAnnouncements(contest).map((item) => (
              <article key={item.title} className="rounded-[16px_6px_14px_6px] border border-soj-line/50 bg-soj-bg/22 p-4">
                <h3 className="text-sm font-semibold text-soj-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-soj-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
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

function SchedulePoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/22 px-3 py-2">
      <dt className="text-xs text-soj-muted">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-soj-text">{value}</dd>
    </div>
  );
}

function RouteAction({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "col-span-2 inline-flex min-h-10 items-center justify-center rounded-soj-md bg-soj-accent px-3 py-2 text-sm font-semibold text-black shadow-[0_14px_34px_rgb(var(--soj-accent)/0.16)] transition hover:brightness-110 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
          : "inline-flex min-h-10 items-center justify-center rounded-soj-md border border-soj-line/55 bg-soj-bg/28 px-3 py-2 text-sm font-medium text-soj-muted transition hover:border-soj-accent/45 hover:text-soj-text active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
      }
    >
      {label}
    </Link>
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
