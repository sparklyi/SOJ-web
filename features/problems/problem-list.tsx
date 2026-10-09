"use client";

import { SearchX } from "lucide-react";
import type { ProblemSummary } from "@/lib/api/types";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/components/providers/i18n-provider";
import { Table, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: ProblemSummary[];
};

/**
 * 题库表格。
 *
 * 表头吸顶，长列表滚动时不丢列名；列宽按内容固定，
 * 保证难度/通过率/状态纵向成列，扫读时不需要重新找基准。
 *
 * 只有四列，而且在 1280 宽度下也不需要横向滚动——列数本身就是一种设计决定：
 * 能放进一屏、并且每一列都参与「要不要做这道题」这个判断的，才留下。
 *
 * 总数及翻页由外层分页组件展示。
 */
export function ProblemList({ problems }: ProblemListProps) {
  const { t, locale } = useI18n();

  if (problems.length === 0) {
    return <EmptyState icon={SearchX} title={t("problems.noMatching")} description={t("problems.noMatchingDescription")} />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHead sticky>
            <TableRow>
              <TableHeaderCell className="min-w-64">{t("problems.table.problem")}</TableHeaderCell>
              <TableHeaderCell className="w-24">{t("problems.table.difficulty")}</TableHeaderCell>
              <TableHeaderCell className="w-36 text-right">{t("problems.table.acceptance")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} t={t} locale={locale} />
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
