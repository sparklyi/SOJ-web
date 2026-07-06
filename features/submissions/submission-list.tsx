import Link from "next/link";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { VerdictBadge } from "@/components/soj/verdict-badge";
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
    <section className="overflow-x-auto rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      <Table aria-label="Submission queue" className="min-w-[860px]">
        <TableHead>
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
            <TableRow key={submission.id}>
              <TableCell className="font-mono text-soj-text">
                <Link className="transition hover:text-soj-accent focus-visible:outline-soj-accent" href={`/submissions/${submission.id}`}>
                  #{submission.id}
                </Link>
              </TableCell>
              <TableCell>
                <VerdictBadge status={submission.status} />
              </TableCell>
              <TableCell>
                <div className="grid gap-1">
                  <span className="text-soj-text">{submission.problemTitle}</span>
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
    </section>
  );
}
