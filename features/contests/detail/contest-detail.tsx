import { LocalizedLink } from "@/components/i18n/localized-link";
import { ContestClock } from "@/components/soj/contest-clock";
import { StatusPill } from "@/components/soj/status-pill";
import { getContestDurationMinutes } from "@/lib/domain/contest";
import type { ContestStatus, ContestSummary, ContestType } from "@/lib/api/types";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import { ContestProblemTable } from "./contest-problem-table";
import { ContestRegistration } from "./contest-registration";

type ContestDetailProps = {
  contest: ContestSummary & {
    canRegister: boolean;
    canSubmit: boolean;
  };
};

const statusView: Record<ContestStatus, { label: MessageKey; tone: React.ComponentProps<typeof StatusPill>["tone"]; clockLabel: MessageKey; clockValue: MessageKey }> = {
  scheduled: { label: "contests.status.scheduled", tone: "info", clockLabel: "contests.detail.startWindow", clockValue: "contests.state.standby" },
  running: { label: "contests.status.running", tone: "accent", clockLabel: "contests.detail.contestClock", clockValue: "status.live" },
  frozen: { label: "contests.status.frozen", tone: "warning", clockLabel: "contests.detail.scoreboardFreeze", clockValue: "contests.state.active" },
  ended: { label: "contests.status.ended", tone: "neutral", clockLabel: "contests.detail.contestClock", clockValue: "contests.state.closed" },
  unsealed: { label: "contests.status.unsealed", tone: "success", clockLabel: "contests.detail.finalState", clockValue: "contests.state.public" },
};

const typeLabel: Record<ContestType, MessageKey> = {
  acm: "contests.type.acmPenalty",
  oi: "contests.type.oiScoring",
};

export async function ContestDetail({ contest }: ContestDetailProps) {
  const t = await getServerTranslator();
  const locale = await getServerLocale();
  const status = statusView[contest.status];
  const duration = getContestDurationMinutes(contest);
  const firstProblemId = contest.problems[0]?.problemId;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section aria-label={t("contests.detail.command")} className="soj-contest-detail-stage soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative z-[1] flex min-w-0 flex-col justify-between gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={status.tone}>{t(status.label)}</StatusPill>
              <StatusPill tone="neutral">{t(typeLabel[contest.type])}</StatusPill>
              {contest.registered ? <StatusPill tone="success">{t("contests.detail.registered")}</StatusPill> : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none tracking-tight md:text-7xl">{contest.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-soj-muted">
              {t("contests.detail.description")}
            </p>
            <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <SchedulePoint label={t("contests.detail.starts")} value={formatDate(contest.startsAt, locale)} />
              <SchedulePoint label={t("contests.detail.freeze")} value={formatDate(contest.freezeAt, locale)} />
              <SchedulePoint label={t("contests.detail.ends")} value={formatDate(contest.endsAt, locale)} />
            </dl>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="soj-contest-timeline">
              <span className="soj-contest-mark soj-contest-mark-start">{t("contests.detail.timeline.start")}</span>
              <span className="soj-contest-mark soj-contest-mark-freeze">{t("contests.detail.timeline.freeze")}</span>
              <span className="soj-contest-mark soj-contest-mark-end">{t("contests.detail.timeline.end")}</span>
            </div>
            <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              <ContestMetric label={t("contests.metric.duration")} value={formatDuration(duration, t)} />
              <ContestMetric label={t("contests.metric.problems")} value={String(contest.problems.length)} tone="accent" />
              <ContestMetric label={t("contests.metric.submit")} value={contest.canSubmit ? t("status.open") : t("contests.state.closed")} tone={contest.canSubmit ? "success" : "muted"} />
            </dl>
          </div>
        </div>

        <aside className="relative z-[1] grid content-between gap-4">
          <ContestClock label={t(status.clockLabel)} value={t(status.clockValue)} frozen={contest.status === "frozen"} />
          <ContestRegistration contest={contest} />
          <div className="grid grid-cols-2 gap-3">
            <RouteAction href={`/contests/${contest.id}/scoreboard`} label={t("contests.action.scoreboard")} />
            <RouteAction href={`/contests/${contest.id}/arena`} label={t("contests.action.arena")} />
            {firstProblemId ? <RouteAction href={`/contests/${contest.id}/problems/${firstProblemId}`} label={t("contests.action.firstProblem")} primary /> : null}
          </div>
        </aside>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-6">
          <ContestProblemTable contest={contest} t={t} />
          <section aria-labelledby="contest-rules-heading" className="soj-contest-brief p-5 md:p-6">
            <h2 id="contest-rules-heading" className="text-2xl font-semibold tracking-tight">{t("contests.detail.rules")}</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-soj-muted">
              {buildRules(contest).map((rule) => (
                <li key={rule} className="border-l border-soj-accent/35 pl-3">{t(rule)}</li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="contest-announcements-heading" className="soj-contest-brief sticky top-24 p-5">
          <h2 id="contest-announcements-heading" className="text-2xl font-semibold tracking-tight">{t("contests.detail.announcements")}</h2>
          <div className="mt-5 grid gap-4">
            {buildAnnouncements(contest).map((item) => (
              <article key={item.title} className="rounded-[16px_6px_14px_6px] border border-soj-line/50 bg-soj-bg/22 p-4">
                <h3 className="text-sm font-semibold text-soj-text">{t(item.title)}</h3>
                <p className="mt-2 text-sm leading-6 text-soj-muted">{t(item.body)}</p>
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
    <LocalizedLink
      href={href}
      className={
        primary
          ? "col-span-2 inline-flex min-h-10 items-center justify-center rounded-soj-md bg-soj-accent px-3 py-2 text-sm font-semibold text-black shadow-[0_14px_34px_rgb(var(--soj-accent)/0.16)] transition hover:brightness-110 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
          : "inline-flex min-h-10 items-center justify-center rounded-soj-md border border-soj-line/55 bg-soj-bg/28 px-3 py-2 text-sm font-medium text-soj-muted transition hover:border-soj-accent/45 hover:text-soj-text active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
      }
    >
      {label}
    </LocalizedLink>
  );
}

function buildRules(contest: ContestSummary): MessageKey[] {
  if (contest.type === "acm") {
    return [
      "contests.rules.acm.accepted",
      "contests.rules.acm.freeze",
      "contests.rules.registered",
    ];
  }

  return [
    "contests.rules.oi.partial",
    "contests.rules.oi.highest",
    "contests.rules.registered",
  ];
}

function buildAnnouncements(contest: ContestSummary): Array<{ title: MessageKey; body: MessageKey }> {
  const freezeAnnouncement =
    contest.status === "frozen"
      ? {
          title: "contests.announcement.freeze.title" as const,
          body: "contests.announcement.freeze.body" as const,
        }
      : {
          title: "contests.announcement.stable.title" as const,
          body: "contests.announcement.stable.body" as const,
        };

  return [
    freezeAnnouncement,
    {
      title: "contests.announcement.permission.title",
      body: contest.registered ? "contests.announcement.permission.registered" : "contests.announcement.permission.unregistered",
    },
  ];
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDuration(minutes: number, t: Translator) {
  if (minutes <= 0) return t("contests.duration.unset");
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return t("contests.duration.minutes", { value: remainder });
  if (remainder === 0) return t("contests.duration.hours", { value: hours });
  return `${t("contests.duration.hours", { value: hours })} ${t("contests.duration.minutes", { value: remainder })}`;
}
