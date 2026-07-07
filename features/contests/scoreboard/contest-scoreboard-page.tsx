import { RankMovement } from "@/components/soj/rank-movement";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestSummary } from "@/lib/api/types";
import type { ScoreboardModel, ScoreboardProblemCell } from "@/lib/domain/scoreboard";

type ContestScoreboardPageProps = {
  contest: ContestSummary;
  scoreboard: ScoreboardModel;
};

const statusLabel: Record<ScoreboardProblemCell["status"], string> = {
  none: "No run",
  pending: "Pending",
  accepted: "AC",
  wrong_answer: "WA",
  partial: "Partial",
  first_blood: "First blood",
};

export function ContestScoreboardPage({ contest, scoreboard }: ContestScoreboardPageProps) {
  const problemColumns = scoreboard.rows[0]?.problems ?? [];
  const leader = scoreboard.rows[0];
  const movementTotal = scoreboard.rows.reduce((sum, row) => sum + Math.abs(row.movement ?? 0), 0);
  const frozen = contest.status === "frozen";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <section className="soj-scoreboard-stage soj-enter grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative z-[1] min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={frozen ? "warning" : "accent"}>{frozen ? "Frozen" : "Live"}</StatusPill>
            <StatusPill tone="neutral">{scoreboard.type.toUpperCase()}</StatusPill>
          </div>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-none tracking-tight md:text-7xl">Scoreboard</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-soj-muted">
            {contest.title} ranking, per-problem results, movement, and freeze state in one dense board.
          </p>
          <div className="mt-7 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            <ScoreMetric label="Freeze status" value={frozen ? "Active" : "Open"} tone={frozen ? "warning" : "accent"} />
            <ScoreMetric label="Rank movement" value={`${movementTotal}`} tone={movementTotal > 0 ? "accent" : "muted"} />
            <ScoreMetric label="Problems" value={String(problemColumns.length)} />
            <ScoreMetric label="Teams" value={String(scoreboard.rows.length)} />
          </div>
        </div>

        <aside className="relative z-[1] grid content-between gap-4">
          <div className="soj-scoreboard-leader p-4">
            <span className="text-sm text-soj-muted">Current leader</span>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-5xl font-semibold leading-none text-soj-accent">{leader?.rank ?? "-"}</div>
                <div className="mt-2 text-xl font-semibold text-soj-text">{leader?.handle ?? "No rank"}</div>
              </div>
              {leader ? <RankMovement delta={leader.movement ?? 0} /> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreMetric label={scoreboard.type === "acm" ? "Solved" : "Score"} value={leader ? topValue(leader) : "-"} tone="accent" />
            <ScoreMetric label={scoreboard.type === "acm" ? "Penalty" : "Last delta"} value={leader ? sideValue(leader) : "-"} />
          </div>
        </aside>
      </section>

      <section className="soj-scoreboard-board overflow-hidden">
        <div className="grid gap-3 border-b border-soj-line/55 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{scoreboard.type.toUpperCase()} rank matrix</h2>
            <p className="mt-2 text-sm leading-6 text-soj-muted">Problem columns track accepted, pending, penalty, movement, and score states.</p>
          </div>
          <StatusPill tone={frozen ? "warning" : "accent"} className="justify-self-start">
            {frozen ? "Freeze active" : "Public ranks"}
          </StatusPill>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-soj-line/65 text-xs uppercase tracking-[0.16em] text-soj-muted">
                <th className="sticky left-0 z-[2] bg-soj-bg-raised/95 px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Handle</th>
                <th className="px-4 py-3 font-medium">{scoreboard.type === "acm" ? "Solved" : "Score"}</th>
                <th className="px-4 py-3 font-medium">{scoreboard.type === "acm" ? "Penalty" : "Movement"}</th>
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
                      <ProblemCell mode={scoreboard.type} problem={problem} />
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

function ProblemCell({ mode, problem }: { mode: ScoreboardModel["type"]; problem: ScoreboardProblemCell }) {
  return (
    <div className={`soj-score-cell soj-score-cell-${problem.status}`}>
      <span>{mode === "acm" ? acmCellLabel(problem) : oiCellLabel(problem)}</span>
    </div>
  );
}

function topValue(row: ScoreboardModel["rows"][number]) {
  return "solved" in row ? String(row.solved) : String(row.score);
}

function sideValue(row: ScoreboardModel["rows"][number]) {
  return "penalty" in row ? String(row.penalty) : `${row.movement && row.movement > 0 ? "+" : ""}${row.movement ?? 0}`;
}

function acmCellLabel(problem: ScoreboardProblemCell) {
  if (problem.status === "accepted" || problem.status === "first_blood") {
    return `${statusLabel[problem.status]} ${problem.penalty ?? 0}`;
  }
  if (problem.attempts) return `${statusLabel[problem.status]} ${problem.attempts}`;
  return statusLabel[problem.status];
}

function oiCellLabel(problem: ScoreboardProblemCell) {
  if (typeof problem.score === "number") return `${problem.score}`;
  return statusLabel[problem.status];
}
