import { RankMovement } from "@/components/soj/rank-movement";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";
import type { ScoreboardModel, ScoreboardProblemCell } from "@/lib/domain/scoreboard";
import { getServerTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";

type ContestScoreboardPageProps = {
  contest: ContestSummary;
  scoreboard: ScoreboardModel;
};

const statusLabel: Record<ScoreboardProblemCell["status"], MessageKey> = {
  none: "contests.scoreboard.noRun",
  pending: "status.pending",
  accepted: "status.accepted",
  wrong_answer: "status.wrongAnswer",
  partial: "contests.scoreboard.partial",
  first_blood: "contests.scoreboard.firstBlood",
};

export async function ContestScoreboardPage({ contest, scoreboard }: ContestScoreboardPageProps) {
  const t = await getServerTranslator();
  const problemColumns = scoreboard.rows[0]?.problems ?? [];
  const leader = scoreboard.rows[0];
  const movementTotal = scoreboard.rows.reduce((sum, row) => sum + Math.abs(row.movement ?? 0), 0);
  const frozen = scoreboard.view === "frozen" || contest.status === "frozen";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <section className="soj-scoreboard-stage soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative z-[1] min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? t("contests.scoreboard.frozen") : t("contests.scoreboard.live")}</StatusPill>
            <StatusPill tone="neutral">{t(scoreboard.type === "acm" ? "status.acm" : "status.oi")}</StatusPill>
          </div>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none tracking-tight md:text-7xl">{t("contests.scoreboard.title")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-soj-muted">
            {t("contests.scoreboard.description", { contest: contest.title })}
          </p>
          <div className="mt-7 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            <ScoreMetric label={t("contests.scoreboard.freezeStatus")} value={frozen ? t("contests.state.active") : t("status.open")} tone={frozen ? "warning" : "accent"} />
            <ScoreMetric label={t("contests.scoreboard.rankMovement")} value={`${movementTotal}`} tone={movementTotal > 0 ? "accent" : "muted"} />
            <ScoreMetric label={t("contests.metric.problems")} value={String(problemColumns.length)} />
            <ScoreMetric label={t("contests.scoreboard.teams")} value={String(scoreboard.rows.length)} />
          </div>
        </div>

        <aside className="relative z-[1] grid content-between gap-4">
          <div className="soj-scoreboard-leader p-4">
            <span className="text-sm text-soj-muted">{t("contests.scoreboard.currentLeader")}</span>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-5xl font-semibold leading-none text-soj-accent">{leader?.rank ?? "-"}</div>
                <div className="mt-2 text-xl font-semibold text-soj-text">{leader?.handle ?? t("contests.scoreboard.noRank")}</div>
              </div>
              {leader ? <RankMovement delta={leader.movement ?? 0} /> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreMetric label={t(scoreboard.type === "acm" ? "scoreboard.solved" : "scoreboard.score")} value={leader ? topValue(leader) : "-"} tone="accent" />
            <ScoreMetric label={t(scoreboard.type === "acm" ? "scoreboard.penalty" : "contests.scoreboard.lastDelta")} value={leader ? sideValue(leader) : "-"} />
          </div>
        </aside>
      </section>

      <section className="soj-scoreboard-board overflow-hidden">
        <div className="grid gap-3 border-b border-soj-line/55 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("contests.scoreboard.matrixTitle", { mode: t(scoreboard.type === "acm" ? "status.acm" : "status.oi") })}</h2>
            <p className="mt-2 text-sm leading-6 text-soj-muted">{t("contests.scoreboard.matrixDescription")}</p>
          </div>
          <StatusPill tone={frozen ? "warning" : "accent"} className="justify-self-start">
            {frozen ? t("contest.freezeActive") : t("contests.scoreboard.publicRanks")}
          </StatusPill>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-soj-line/65 text-xs uppercase tracking-[0.16em] text-soj-muted">
                <th className="sticky left-0 z-[2] bg-soj-bg-raised/95 px-4 py-3 font-medium">{t("scoreboard.rank")}</th>
                <th className="px-4 py-3 font-medium">{t("scoreboard.handle")}</th>
                <th className="px-4 py-3 font-medium">{t(scoreboard.type === "acm" ? "scoreboard.solved" : "scoreboard.score")}</th>
                <th className="px-4 py-3 font-medium">{t(scoreboard.type === "acm" ? "scoreboard.penalty" : "scoreboard.movement")}</th>
                {problemColumns.map((problem) => (
                  <th key={problem.alias} className="px-3 py-3 text-center font-medium">
                    {problem.alias}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoreboard.rows.map((row) => (
                <tr key={row.id} className="soj-score-row border-b border-soj-line/55">
                  <td className="sticky left-0 z-[1] bg-soj-bg-raised/95 px-4 py-4">
                    <span className="grid h-10 w-10 place-items-center rounded-[14px_4px_12px_4px] border border-soj-accent/40 bg-soj-accent/10 font-mono text-lg font-semibold text-soj-accent">
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-soj-text">{row.handle}</div>
                    <div className="mt-1 font-mono text-xs text-soj-muted">{row.id}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-lg text-soj-accent">{"solved" in row ? row.solved : row.score}</td>
                  <td className="px-4 py-4 font-mono">{"penalty" in row ? row.penalty : <RankMovement delta={row.movement ?? 0} />}</td>
                  {row.problems.map((problem) => (
                    <td key={`${row.id}-${problem.alias}`} className="px-3 py-4 text-center">
                      <ProblemCell mode={scoreboard.type} problem={problem} t={t} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ScoreMetric({ label, value, tone = "text" }: { label: string; value: string; tone?: "text" | "accent" | "warning" | "muted" }) {
  const toneClass = {
    text: "text-soj-text",
    accent: "text-soj-accent",
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

function ProblemCell({ mode, problem, t }: { mode: ScoreboardModel["type"]; problem: ScoreboardProblemCell; t: (key: MessageKey) => string }) {
  return (
    <div className={`soj-score-cell soj-score-cell-${problem.status}`}>
      <span>{mode === "acm" ? acmCellLabel(problem, t) : oiCellLabel(problem, t)}</span>
    </div>
  );
}

function topValue(row: ScoreboardModel["rows"][number]) {
  return "solved" in row ? String(row.solved) : String(row.score);
}

function sideValue(row: ScoreboardModel["rows"][number]) {
  return "penalty" in row ? String(row.penalty) : `${row.movement && row.movement > 0 ? "+" : ""}${row.movement ?? 0}`;
}

function acmCellLabel(problem: ScoreboardProblemCell, t: (key: MessageKey) => string) {
  if (problem.status === "accepted" || problem.status === "first_blood") {
    return `${t(statusLabel[problem.status])} ${problem.penalty ?? 0}`;
  }
  if (problem.attempts) return `${t(statusLabel[problem.status])} ${problem.attempts}`;
  return t(statusLabel[problem.status]);
}

function oiCellLabel(problem: ScoreboardProblemCell, t: (key: MessageKey) => string) {
  if (typeof problem.score === "number") return `${problem.score}`;
  return t(statusLabel[problem.status]);
}
