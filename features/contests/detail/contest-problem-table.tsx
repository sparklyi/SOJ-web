import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import { buttonVariants } from "@/components/ui/button";
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
        {/* 计数就是一行等宽字，不是一枚描边胶囊。 */}
        <span className="self-start font-mono text-sm text-soj-accent">
          {contest.problems.length}
        </span>
      </div>
      <div className="grid gap-0">
        {contest.problems.map((problem) => (
          <article key={problem.problemId} className="soj-contest-problem-row grid gap-4 p-4 md:grid-cols-[86px_minmax(0,1fr)_150px_150px] md:items-center">
            {/* 曾经是不对称切角 + 强调色底（accent/10）的别名块：切角是被清理的舞台装饰
                在工具类里的残留；而每一行都点一盏蓝灯，强调色预算就爆了。
                别名块回到中性的「一格」，靠等宽大字自己成立。 */}
            <div className="grid h-16 w-16 place-items-center rounded-soj-md border border-soj-line/70 bg-soj-bg/45 font-mono text-2xl font-semibold text-soj-text">
              {problem.alias}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-soj-text">{problem.title}</h3>
              <p className="mt-1 text-sm text-soj-muted">{t("contests.problem.workspaceDescription")}</p>
            </div>
            <div>{contest.canSubmit ? <StatusPill tone="accent">{t("contests.problem.submitOpen")}</StatusPill> : <StatusPill tone="neutral">{t("contests.problem.reviewMode")}</StatusPill>}</div>
            <LocalizedLink href={`/contests/${contest.id}/problems/${problem.problemId}`} className={buttonVariants({ variant: "solid", size: "sm" })} aria-label={`${t("contests.action.openProblem")} ${problem.alias}`}>
              {t("contests.action.openProblem")}
            </LocalizedLink>
          </article>
        ))}
      </div>
    </section>
  );
}
