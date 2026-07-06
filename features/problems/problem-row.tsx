import Link from "next/link";
import type { ProblemSummary } from "@/lib/api/types";
import { getAcceptanceRate } from "@/lib/domain/problem";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { TableCell, TableRow } from "@/components/ui/table";

const difficultyTone = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

const difficultyLabel = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

export function ProblemRow({ problem }: { problem: ProblemSummary }) {
  const acceptance = getAcceptanceRate(problem);

  return (
    <TableRow>
      <TableCell className="min-w-64">
        <Link
          href={`/problems/${problem.id}`}
          className="grid gap-1 rounded-soj-sm text-soj-text transition hover:text-soj-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          <span className="font-medium">{problem.title}</span>
          <span className="font-mono text-xs text-soj-muted">{problem.slug}</span>
        </Link>
      </TableCell>
      <TableCell>
        <ProblemStatus status={problem.status} />
      </TableCell>
      <TableCell>
        <StatusPill tone={difficultyTone[problem.difficulty]}>{difficultyLabel[problem.difficulty]}</StatusPill>
      </TableCell>
      <TableCell>
        <div className="flex max-w-80 flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <StatusPill key={tag}>{tag}</StatusPill>
          ))}
        </div>
      </TableCell>
      <TableCell className="font-mono text-soj-text">{acceptance.toFixed(1)}%</TableCell>
      <TableCell className="font-mono text-soj-muted">{problem.submissionCount}</TableCell>
    </TableRow>
  );
}
