import { SearchX } from "lucide-react";
import type { ProblemSummary } from "@/lib/api/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/ui/number";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: ProblemSummary[];
  totalCount: number;
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
 * 页脚只有一个数字：「筛选后还剩 x / 总数」。
 * 曾经左边还有一个「N 道题目可供练习」——它把同一个数字复述了一遍，
 * 而且读起来像运营文案，删掉之后页脚回到它该有的样子：一行坐标，不是一句话。
 */
export async function ProblemList({ problems, totalCount }: ProblemListProps) {
  const [t, locale] = await Promise.all([getServerTranslator(), getServerLocale()]);

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
              <TableHeaderCell className="w-28">{t("problems.table.status")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} t={t} locale={locale} />
            ))}
          </tbody>
        </Table>
      </div>
      <div className="flex items-center justify-end border-t border-soj-line px-4 py-2.5">
        <span className="font-mono text-xs text-soj-muted">
          {formatNumber(problems.length, { locale })}/{formatNumber(totalCount, { locale })}
        </span>
      </div>
    </>
  );
}
