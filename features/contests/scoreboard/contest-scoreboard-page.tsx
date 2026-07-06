import { ContestClock } from "@/components/soj/contest-clock";
import { RankMovement } from "@/components/soj/rank-movement";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ContestSummary } from "@/lib/api/types";
import type { ScoreboardModel, ScoreboardProblemCell } from "@/lib/domain/scoreboard";

type ContestScoreboardPageProps = {
  contest: ContestSummary;
  scoreboard: ScoreboardModel;
};

const statusTone: Record<ScoreboardProblemCell["status"], React.ComponentProps<typeof StatusPill>["tone"]> = {
  none: "neutral",
  pending: "warning",
  accepted: "success",
  wrong_answer: "danger",
  partial: "warning",
  first_blood: "accent",
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
  const gridRows = scoreboard.rows.map((row) => ({
    id: row.id,
    rank: row.rank,
    handle: row.handle,
    solved: "solved" in row ? row.solved : undefined,
    penalty: "penalty" in row ? row.penalty : undefined,
    score: "score" in row ? row.score : undefined,
    movement: row.movement ?? 0,
  }));

  return (
    <div className="grid min-w-0 gap-5">
      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ContestClock label="Freeze countdown" value={contest.status === "frozen" ? "00:00:00" : "00:47:18"} frozen={contest.status === "frozen"} />
        <SignalFeed
          items={[
            { id: "freeze", label: "Freeze status", value: contest.status === "frozen" ? "Active" : "Open", tone: contest.status === "frozen" ? "warning" : "accent" },
            { id: "movement", label: "Rank movement", value: "+2 leader delta", tone: "accent" },
            { id: "mode", label: "Scoring mode", value: scoreboard.type.toUpperCase(), tone: scoreboard.type === "acm" ? "neutral" : "warning" },
          ]}
        />
      </section>

      <section className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-soj-text">Rank overview</h2>
            <p className="mt-1 text-sm text-soj-muted">Dense ranking, movement, and contest totals.</p>
          </div>
          <StatusPill tone={contest.status === "frozen" ? "warning" : "accent"}>{contest.status}</StatusPill>
        </div>
        <ScoreboardGrid rows={gridRows} mode={scoreboard.type} />
      </section>

      <section className="overflow-x-auto rounded-soj-lg border border-soj-line bg-soj-bg-raised">
        <div className="flex items-center justify-between gap-3 border-b border-soj-line px-4 py-3">
          <h2 className="text-lg font-semibold text-soj-text">{scoreboard.type.toUpperCase()} problem matrix</h2>
          <StatusPill tone="accent">{problemColumns.length} problems</StatusPill>
        </div>
        <Table className="min-w-[760px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Rank</TableHeaderCell>
              <TableHeaderCell>Handle</TableHeaderCell>
              {scoreboard.type === "acm" ? <TableHeaderCell>Solved</TableHeaderCell> : <TableHeaderCell>Total</TableHeaderCell>}
              {scoreboard.type === "acm" ? <TableHeaderCell>Penalty</TableHeaderCell> : <TableHeaderCell>Last delta</TableHeaderCell>}
              {problemColumns.map((problem) => (
                <TableHeaderCell key={problem.alias} className="text-center">
                  {problem.alias}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <tbody>
            {scoreboard.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-soj-text">{row.rank}</TableCell>
                <TableCell className="font-medium text-soj-text">{row.handle}</TableCell>
                <TableCell className="font-mono text-soj-accent">{"solved" in row ? row.solved : row.score}</TableCell>
                <TableCell className="font-mono">
                  {"penalty" in row ? row.penalty : <RankMovement delta={row.movement ?? 0} />}
                </TableCell>
                {row.problems.map((problem) => (
                  <TableCell key={`${row.id}-${problem.alias}`} className="text-center">
                    <StatusPill tone={statusTone[problem.status]}>
                      {scoreboard.type === "acm" ? acmCellLabel(problem) : oiCellLabel(problem)}
                    </StatusPill>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
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
