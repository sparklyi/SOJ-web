import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/translate";

type ContestProblemTableProps = {
  contest: ContestSummary & {
    canSubmit: boolean;
  };
  t: Translator;
};

export function ContestProblemTable({ contest, t }: ContestProblemTableProps) {
  return (
    <section aria-labelledby="contest-problems-heading" className="soj-contest-problem-deck overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-soj-line/55 p-5">
        <div>
          <h2 id="contest-problems-heading" className="text-2xl font-semibold tracking-tight">{t("contests.problem.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-soj-muted">{t("contests.problem.description")}</p>
        </div>
        <span className="self-start rounded-soj-md border border-soj-line/50 bg-soj-bg/24 px-3 py-2 font-mono text-sm text-soj-accent">
          {contest.problems.length}
        </span>
      </div>
      <div className="grid gap-0">
        {contest.problems.map((problem) => (
          <article key={problem.problemId} className="soj-contest-problem-row grid gap-4 p-4 md:grid-cols-[86px_minmax(0,1fr)_150px_150px] md:items-center">
            <div className="grid h-16 w-16 place-items-center rounded-[18px_6px_14px_6px] border border-soj-accent/40 bg-soj-accent/10 font-mono text-2xl font-semibold text-soj-accent">
              {problem.alias}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-soj-text">{problem.title}</h3>
              <p className="mt-1 text-sm text-soj-muted">{t("contests.problem.workspaceDescription")}</p>
            </div>
            <div>{contest.canSubmit ? <StatusPill tone="accent">{t("contests.problem.submitOpen")}</StatusPill> : <StatusPill tone="neutral">{t("contests.problem.reviewMode")}</StatusPill>}</div>
            <LocalizedLink href={`/contests/${contest.id}/problems/${problem.problemId}`} className="inline-flex min-h-10 items-center justify-center rounded-soj-md border border-soj-line/55 bg-soj-bg/28 px-3 py-2 text-sm font-medium text-soj-muted transition hover:border-soj-accent/45 hover:text-soj-text active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent" aria-label={`${t("contests.action.openProblem")} ${problem.alias}`}>
              {t("contests.action.openProblem")}
            </LocalizedLink>
          </article>
        ))}
      </div>
    </section>
  );
}
