"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { cn } from "@/lib/ui/cn";
import type { listSubmissions } from "./api";

type SubmissionListProps = {
  submissions: Awaited<ReturnType<typeof listSubmissions>>["items"];
};

function formatSubmittedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatRuntime(value: number | undefined, t: ReturnType<typeof useI18n>["t"]) {
  return typeof value === "number" ? `${value} ms` : t("submissions.value.pending");
}

function formatMemory(value: number | undefined, t: ReturnType<typeof useI18n>["t"]) {
  return typeof value === "number" ? `${value} KB` : t("submissions.value.pending");
}

function contestLabel(submission: SubmissionListProps["submissions"][number], t: ReturnType<typeof useI18n>["t"]) {
  if (!submission.contestId) return t("submissions.page.practice");
  return submission.contestTitle ?? `Contest #${submission.contestId}`;
}

export function SubmissionList({ submissions }: SubmissionListProps) {
  const { locale, t } = useI18n();

  return (
    <section className="soj-submission-board">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/60 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-soj-text">{t("submissions.list.title")}</h2>
          <p className="mt-1 text-sm text-soj-muted">{t("submissions.list.description")}</p>
        </div>
        <span className="rounded-full border border-soj-line/70 bg-soj-bg/40 px-3 py-1 font-mono text-xs text-soj-muted">
          {t("submissions.list.records", { count: submissions.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table aria-label={t("submissions.list.ariaLabel")} className="min-w-[940px]">
          <TableHead className="border-soj-line/70 bg-soj-bg/28">
            <tr>
              <TableHeaderCell>{t("submissions.list.run")}</TableHeaderCell>
              <TableHeaderCell>{t("submissions.list.verdict")}</TableHeaderCell>
              <TableHeaderCell>{t("submissions.list.problem")}</TableHeaderCell>
              <TableHeaderCell>{t("submissions.list.contest")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.score")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.time")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.memory")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.submitted")}</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {submissions.map((submission) => (
              <TableRow
                key={submission.id}
                className={cn("soj-submission-row", submission.displayState.terminal ? "soj-submission-row-terminal" : "soj-submission-row-live")}
              >
                <TableCell className="font-mono text-soj-text">
                  <LocalizedLink
                    className="inline-flex min-w-14 items-center justify-center rounded-soj-md border border-soj-line/60 bg-soj-bg/42 px-2.5 py-1.5 transition hover:border-soj-accent/55 hover:text-soj-accent focus-visible:outline-soj-accent"
                    href={`/submissions/${submission.id}`}
                  >
                    #{submission.id}
                  </LocalizedLink>
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
                <TableCell className="text-soj-muted">{contestLabel(submission, t)}</TableCell>
                <TableCell className="text-right font-mono text-soj-text">{submission.score}</TableCell>
                <TableCell className="text-right font-mono text-soj-muted">{formatRuntime(submission.timeMs, t)}</TableCell>
                <TableCell className="text-right font-mono text-soj-muted">{formatMemory(submission.memoryKb, t)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt, locale)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
