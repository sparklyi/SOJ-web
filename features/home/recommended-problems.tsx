import Link from "next/link";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ProblemSummary } from "@/lib/api/types";

type RecommendedProblemsProps = {
  problems: ProblemSummary[];
};

export function RecommendedProblems({ problems }: RecommendedProblemsProps) {
  return (
    <section aria-labelledby="recommended-problems-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recommended-problems-heading" className="text-xl font-semibold text-soj-text">
          Recommended problems
        </h2>
        <Link className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/problems">
          Problems
        </Link>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Problem</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Difficulty</TableHeaderCell>
          </TableRow>
        </TableHead>
        <tbody>
          {problems.map((problem) => (
            <TableRow key={problem.id}>
              <TableCell>
                <Link className="font-medium text-soj-text hover:text-soj-accent" href={`/problems/${problem.id}`}>
                  {problem.title}
                </Link>
              </TableCell>
              <TableCell>
                <ProblemStatus status={problem.status} />
              </TableCell>
              <TableCell>
                <StatusPill tone={problem.difficulty === "hard" ? "warning" : problem.difficulty === "medium" ? "info" : "success"}>{problem.difficulty}</StatusPill>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </section>
  );
}
