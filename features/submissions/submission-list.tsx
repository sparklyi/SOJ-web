"use client";

import { Fragment } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Panel } from "@/components/ui/panel";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { formatDuration, formatMemory } from "@/lib/ui/number";
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

/**
 * 耗时与内存。
 *
 * 两件事：①走 `lib/ui/number` 的唯一实现，别在这里手写 `${value} ms`
 * ——否则同一份数字会在题库页写成「1.0 s」、在这里写成「1000 ms」；
 * ②还没跑完（排队中 / 编译中）或根本没跑起来（编译失败 / 系统错误）的提交
 * **没有**这两个数值，原先回落到「等待中」，于是整列连成一串同一个词。
 * 没有数值就是破折号。
 */
function formatTime(value: number | undefined, locale: string) {
  return typeof value === "number" ? formatDuration(value, locale) : "—";
}

function formatMemoryColumn(value: number | undefined, locale: string) {
  return typeof value === "number" ? formatMemory(value, locale) : "—";
}

function contestLabel(submission: SubmissionListProps["submissions"][number], t: ReturnType<typeof useI18n>["t"]) {
  if (!submission.contestId) return t("submissions.page.practice");
  return submission.contestTitle ?? `Contest #${submission.contestId}`;
}

/**
 * 提交记录表。
 *
 * 「比赛」与「分数」原先各占一列，八列铺开必须横向滚动，
 * 而这两项对绝大多数行是空的或常量——练习提交没有比赛，待判的提交没有分数。
 * 空列比空行更刺眼：它让表格看起来像没填完。
 *
 * 现在把它们折进题名格，作为题名下方的第二行元信息（`P5 · Sundial Weekly Contest · 得分 35`），
 * 有才显示。列数从八降到六，1280 宽度下一屏放得下，
 * 而排查问题真正需要的耗时、内存、提交时间全部保留。
 */
export function SubmissionList({ submissions }: SubmissionListProps) {
  const { locale, t } = useI18n();

  return (
    /* 曾经是 soj-submission-board「舞台类」+ soj-submission-row-terminal/live 死类。
       容器就是一块普通面板，与题库页同一个原语。 */
    <Panel variant="flush" aria-label={t("submissions.list.ariaLabel")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/60 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-soj-text">{t("submissions.list.title")}</h2>
          <p className="mt-1 text-sm text-soj-muted">{t("submissions.list.description")}</p>
        </div>
        {/* 计数不再做成一枚描边胶囊——那是一个「无按钮外观的小按钮」。 */}
        <span className="font-mono text-xs text-soj-muted">
          {t("submissions.list.records", { count: submissions.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table aria-label={t("submissions.list.ariaLabel")} className="min-w-[820px]">
          <TableHead className="border-soj-line/70 bg-soj-bg/28">
            <tr>
              <TableHeaderCell>{t("submissions.list.run")}</TableHeaderCell>
              <TableHeaderCell>{t("submissions.list.verdict")}</TableHeaderCell>
              <TableHeaderCell>{t("submissions.list.problem")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.time")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.memory")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("submissions.list.submitted")}</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {submissions.map((submission) => {
              const meta = [`P${submission.problemId}`, contestLabel(submission, t)];
              if (submission.score > 0) meta.push(`${t("submissions.list.score")} ${submission.score}`);

              return (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-soj-text">
                    {/* 行内编号链接就是一行等宽字：不加底色、不加描边、
                        不做成「无按钮外观的小按钮」。 */}
                    <LocalizedLink
                      className="font-mono text-soj-accent underline-offset-4 transition hover:underline focus-visible:underline"
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
                      <span className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-soj-muted">
                        {meta.map((item, index) => (
                          <Fragment key={item}>
                            {index > 0 ? (
                              <span aria-hidden className="text-soj-line-strong">
                                ·
                              </span>
                            ) : null}
                            <span>{item}</span>
                          </Fragment>
                        ))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-soj-muted">{formatTime(submission.timeMs, locale)}</TableCell>
                  <TableCell className="text-right font-mono text-soj-muted">{formatMemoryColumn(submission.memoryKb, locale)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt, locale)}</TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
    </Panel>
  );
}
