"use client";

import { RankMovement } from "@/components/soj/rank-movement";
import { StatusPill } from "@/components/soj/status-pill";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ContestSummary } from "@/lib/api/types";
import type { ScoreboardModel, ScoreboardProblemCell } from "@/lib/domain/scoreboard";
import type { MessageKey } from "@/lib/i18n/messages";

type ContestScoreboardPageProps = {
  contest: ContestSummary;
  scoreboard: ScoreboardModel;
};

// 非判定态的单元格词条（无提交 / 等待中）。判定态用通用短码，见 acmCellLabel。
const statusLabel: Record<"none" | "pending", MessageKey> = {
  none: "contests.scoreboard.noRun",
  pending: "status.pending",
};

export function ContestScoreboardPage({ contest, scoreboard }: ContestScoreboardPageProps) {
  const { t } = useI18n();
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
            <StatusPill tone="neutral">{t("status.acm")}</StatusPill>
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
            <ScoreMetric label={t("scoreboard.solved")} value={leader ? String(leader.solved) : "-"} tone="accent" />
            <ScoreMetric label={t("scoreboard.penalty")} value={leader ? String(leader.penalty) : "-"} />
          </div>
        </aside>
      </section>

      <section className="soj-scoreboard-board overflow-hidden">
        <div className="grid gap-3 border-b border-soj-line/55 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("contests.scoreboard.matrixTitle", { mode: t("status.acm") })}</h2>
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
                <th className="px-4 py-3 font-medium">{t("scoreboard.solved")}</th>
                <th className="px-4 py-3 font-medium">{t("scoreboard.penalty")}</th>
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
                    <span className="grid h-10 w-10 place-items-center rounded-soj-md border border-soj-accent/40 bg-soj-accent/10 font-mono text-lg font-semibold text-soj-accent">
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-soj-text">{row.handle}</div>
                    <div className="mt-1 font-mono text-xs text-soj-muted">{row.id}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-lg text-soj-accent">{row.solved}</td>
                  <td className="px-4 py-4 font-mono">{row.penalty}</td>
                  {row.problems.map((problem) => (
                    <td key={`${row.id}-${problem.alias}`} className="px-3 py-4 text-center">
                      <ProblemCell problem={problem} t={t} />
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
    <div className="soj-chip p-3">
      <div className="text-xs text-soj-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl ${toneClass}`}>{value}</div>
    </div>
  );
}

function ProblemCell({ problem, t }: { problem: ScoreboardProblemCell; t: (key: MessageKey) => string }) {
  return (
    <div className={`soj-score-cell soj-score-cell-${problem.status}`}>
      <span>{acmCellLabel(problem, t)}</span>
    </div>
  );
}

function acmCellLabel(problem: ScoreboardProblemCell, t: (key: MessageKey) => string) {
  // 判定用 OJ 通用短码：AC / WA。榜单格子窄，且这两个词本来就跨语言通用。
  const label = problem.status === "accepted" ? "AC" : problem.status === "wrong_answer" ? "WA" : t(statusLabel[problem.status]);
  if (problem.status === "accepted") {
    return `${label} ${problem.penalty ?? 0}`;
  }
  if (problem.attempts) return `${label} ${problem.attempts}`;
  return label;
}
