import type { ProblemSummary } from "@/lib/api/types";
import { Table, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: ProblemSummary[];
  totalCount: number;
};

export function ProblemList({ problems, totalCount }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <section className="soj-data-panel p-8">
        <h2 className="text-lg font-semibold text-soj-text">No matching problems</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-soj-muted">
          Adjust the search text, difficulty, status, or tag filters to reopen the training set.
        </p>
      </section>
    );
  }

  return (
    <section className="soj-data-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/55 px-4 py-4 md:px-5">
        <div>
          <h2 className="text-lg font-semibold text-soj-text">Problems in view</h2>
          <p className="mt-1 text-sm text-soj-muted">Open a statement or keep narrowing the list.</p>
        </div>
        <div className="rounded-soj-md border border-soj-accent/35 bg-soj-accent/10 px-3 py-1.5 font-mono text-xs text-soj-accent">
          {problems.length}/{totalCount}
        </div>
      </div>
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
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </tbody>
        </Table>
      </div>
      <div className="border-t border-soj-line/55 px-4 py-3 font-mono text-xs text-soj-muted">
        {problems.length} problems ready for practice
      </div>
    </section>
  );
}
