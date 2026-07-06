import type { ProblemSummary } from "@/lib/api/types";
import { Table, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: ProblemSummary[];
};

export function ProblemList({ problems }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <section className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-6">
        <h2 className="text-lg font-semibold text-soj-text">No matching problems</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-soj-muted">
          Adjust the search text, difficulty, status, or tag filters to reopen the training set.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Problem</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Difficulty</TableHeaderCell>
              <TableHeaderCell>Tags</TableHeaderCell>
              <TableHeaderCell>Acceptance</TableHeaderCell>
              <TableHeaderCell>Submissions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </tbody>
        </Table>
      </div>
      <div className="border-t border-soj-line px-4 py-3 font-mono text-xs text-soj-muted">
        {problems.length} problems in view
      </div>
    </section>
  );
}
