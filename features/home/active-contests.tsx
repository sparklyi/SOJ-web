import { LocalizedLink } from "@/components/i18n/localized-link";
import { ContestClock } from "@/components/soj/contest-clock";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { getServerTranslator } from "@/lib/i18n/server";

type ActiveContestsProps = {
  contests: ContestSummary[];
};

type FreezeDisplay = { labelKey: MessageKey; value: string; valueKey?: MessageKey; frozen: boolean };

export async function ActiveContests({ contests }: ActiveContestsProps) {
  const t = await getServerTranslator();
  const freeze = freezeDisplay(contests);

  return (
    <section aria-labelledby="active-contests-heading" className="grid gap-4">
      <div className="flex items-end justify-between gap-4 border-b border-soj-line pb-3">
        <h2 id="active-contests-heading" className="text-2xl font-semibold tracking-tight text-soj-text">
          {t("contest.active")}
        </h2>
        <LocalizedLink className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/contests">
          {t("home.contests")}
        </LocalizedLink>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="divide-y divide-soj-line rounded-soj-lg border border-soj-line bg-soj-bg-raised">
          {contests.length > 0 ? contests.map((contest) => (
            <article key={contest.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-soj-text">
                    <LocalizedLink className="hover:text-soj-accent" href={`/contests/${contest.id}`}>
                      {contest.title}
                    </LocalizedLink>
                  </h3>
                  <StatusPill tone={contest.status === "running" ? "accent" : "warning"}>
                    {t(contest.status === "running" ? "status.running" : "status.frozen")}
                  </StatusPill>
                  <StatusPill tone="neutral">{contest.type.toUpperCase()}</StatusPill>
                </div>
                <p className="text-sm leading-6 text-soj-muted">{t("contest.problemsLoaded", { count: contest.problems.length })}</p>
              </div>
              <span className="self-start font-mono text-sm text-soj-accent">{contest.registered ? t("contest.registered") : t("contest.open")}</span>
            </article>
          )) : <p className="px-4 py-6 text-sm text-soj-muted">{t("contest.noActive")}</p>}
        </div>
        <ContestClock label={t(freeze.labelKey)} value={freeze.valueKey ? t(freeze.valueKey) : freeze.value} frozen={freeze.frozen} />
      </div>
    </section>
  );
}

function freezeDisplay(contests: ContestSummary[], now = Date.now()): FreezeDisplay {
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
