import Link from "next/link";
import { StatusPill } from "@/components/soj/status-pill";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ContestSummary } from "@/lib/api/types";

type ContestProblemTableProps = {
  contest: ContestSummary & {
    canSubmit: boolean;
  };
};

export function ContestProblemTable({ contest }: ContestProblemTableProps) {
  return (
    <section aria-labelledby="contest-problems-heading" className="overflow-hidden rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2 border-b border-soj-line p-5">
        <h2 id="contest-problems-heading" className="text-xl font-semibold">Problems</h2>
        <p className="text-sm leading-6 text-soj-muted">Contest aliases stay stable across scoreboard, Arena, and problem workspace routes.</p>
      </div>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Alias</TableHeaderCell>
            <TableHeaderCell>Problem</TableHeaderCell>
            <TableHeaderCell>Permission</TableHeaderCell>
            <TableHeaderCell>Workspace</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {contest.problems.map((problem) => (
            <TableRow key={problem.problemId}>
              <TableCell className="font-mono text-soj-accent">{problem.alias}</TableCell>
              <TableCell className="font-medium text-soj-text">{problem.title}</TableCell>
              <TableCell>
                {contest.canSubmit ? <StatusPill tone="accent">Submit open</StatusPill> : <StatusPill tone="neutral">Review mode</StatusPill>}
              </TableCell>
              <TableCell>
                <Link href={`/contests/${contest.id}/problems/${problem.problemId}`} className="font-medium text-soj-accent transition hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent" aria-label={`Open problem ${problem.alias}`}>
                  Open problem
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </section>
  );
}
