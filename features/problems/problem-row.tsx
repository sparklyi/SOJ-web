import type { ProblemSummary } from "@/lib/api/types";
import { getAcceptanceRate } from "@/lib/domain/problem";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Translator } from "@/lib/i18n/translate";

const difficultyTone = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

const difficultyLabelKey = {
  easy: "problems.difficulty.easy",
  medium: "problems.difficulty.medium",
  hard: "problems.difficulty.hard",
} as const;

const problemStatusLabelKey = {
  todo: "status.todo",
  attempted: "status.attempted",
  accepted: "status.solved",
} as const;

export function ProblemRow({ problem, t }: { problem: ProblemSummary; t: Translator }) {
  const acceptance = getAcceptanceRate(problem);

  return (
    <TableRow>
      <TableCell className="min-w-64">
        <LocalizedLink
          href={`/problems/${problem.id}`}
          className="relative grid gap-1 rounded-soj-sm pl-3 text-soj-text transition duration-200 hover:text-soj-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent group-hover:translate-x-1"
        >
          <span className="absolute left-0 top-1 h-8 w-px bg-soj-accent/0 transition group-hover:bg-soj-accent/70" aria-hidden />
          <span className="font-medium">{problem.title}</span>
          <span className="font-mono text-xs text-soj-muted">{problem.slug}</span>
        </LocalizedLink>
      </TableCell>
      <TableCell>
        <StatusPill tone={problem.status === "accepted" ? "success" : problem.status === "attempted" ? "warning" : "neutral"}>
          {t(problemStatusLabelKey[problem.status])}
        </StatusPill>
      </TableCell>
      <TableCell>
        <StatusPill tone={difficultyTone[problem.difficulty]}>{t(difficultyLabelKey[problem.difficulty])}</StatusPill>
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
      <TableCell>
        <LocalizedLink
          href={`/problems/${problem.id}?submit=1`}
          className="inline-flex h-8 items-center rounded-soj-md border border-soj-line/70 bg-soj-bg/26 px-3 text-xs font-medium text-soj-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition hover:border-soj-accent/60 hover:bg-soj-accent/10 hover:text-soj-accent active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          Submit
        </LocalizedLink>
      </TableCell>
    </TableRow>
  );
}
