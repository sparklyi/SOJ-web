import Link from "next/link";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { cn } from "@/lib/ui/cn";
import type { listSubmissions } from "./api";

type SubmissionListProps = {
  submissions: Awaited<ReturnType<typeof listSubmissions>>["items"];
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatRuntime(value?: number) {
  return typeof value === "number" ? `${value} ms` : "Pending";
}

function formatMemory(value?: number) {
  return typeof value === "number" ? `${value} KB` : "Pending";
}

function contestLabel(contestId?: number) {
  return contestId ? "SOJ Signal Cup" : "Practice";
}

export function SubmissionList({ submissions }: SubmissionListProps) {
  return (
    <section className="soj-submission-board">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/60 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-soj-text">Judge queue</h2>
          <p className="mt-1 text-sm text-soj-muted">Latest verdicts, contest links, and runtime signals.</p>
        </div>
        <span className="rounded-full border border-soj-line/70 bg-soj-bg/40 px-3 py-1 font-mono text-xs text-soj-muted">
          {submissions.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table aria-label="Submission queue" className="min-w-[940px]">
          <TableHead className="border-soj-line/70 bg-soj-bg/28">
            <tr>
              <TableHeaderCell>Run</TableHeaderCell>
              <TableHeaderCell>Verdict</TableHeaderCell>
              <TableHeaderCell>Problem</TableHeaderCell>
              <TableHeaderCell>Contest</TableHeaderCell>
              <TableHeaderCell className="text-right">Score</TableHeaderCell>
              <TableHeaderCell className="text-right">Time</TableHeaderCell>
              <TableHeaderCell className="text-right">Memory</TableHeaderCell>
              <TableHeaderCell className="text-right">Submitted</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {submissions.map((submission) => (
              <TableRow
                key={submission.id}
                className={cn("soj-submission-row", submission.displayState.terminal ? "soj-submission-row-terminal" : "soj-submission-row-live")}
              >
                <TableCell className="font-mono text-soj-text">
                  <Link
                    className="inline-flex min-w-14 items-center justify-center rounded-soj-md border border-soj-line/60 bg-soj-bg/42 px-2.5 py-1.5 transition hover:border-soj-accent/55 hover:text-soj-accent focus-visible:outline-soj-accent"
                    href={`/submissions/${submission.id}`}
                  >
                    #{submission.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <VerdictBadge status={submission.status} />
                </TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <span className="font-medium text-soj-text">{submission.problemTitle}</span>
                    <span className="font-mono text-xs text-soj-muted">P{submission.problemId}</span>
                  </div>
                </TableCell>
                <TableCell className="text-soj-muted">{contestLabel(submission.contestId)}</TableCell>
                <TableCell className="text-right font-mono text-soj-text">{submission.score}</TableCell>
                <TableCell className="text-right font-mono text-soj-muted">{formatRuntime(submission.timeMs)}</TableCell>
                <TableCell className="text-right font-mono text-soj-muted">{formatMemory(submission.memoryKb)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
