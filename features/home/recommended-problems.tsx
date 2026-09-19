import { ListChecks } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { AcceptanceMeter } from "@/components/soj/acceptance-meter";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ProblemSummary } from "@/lib/api/types";
import { getAcceptanceRate, problemDifficultyLabelKey, problemDifficultyTone } from "@/lib/domain/problem";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";

type RecommendedProblemsProps = {
  problems: ProblemSummary[];
};

/**
 * 推荐题目。
 *
 * 旧实现行高按大内边距撑开，三行内容占了整屏高度，信息密度极低。
 * 现在收紧到数据行密度，并让列宽固定，保证状态、难度、通过率成列对齐。
 * 难度标签的色与文案走 lib/domain/problem 的共用映射，
 * 避免这里和题目列表页各写一份、迟早对不上。
 *
 * 通过率直接用题库页同一枚 AcceptanceMeter：同一个指标在首页和题库页
 * 必须是同一种画法，否则读者会以为它们统计口径不同。
 */
export async function RecommendedProblems({ problems }: RecommendedProblemsProps) {
  const [t, locale] = await Promise.all([getServerTranslator(), getServerLocale()]);

  return (
    <Panel variant="flush" aria-label={t("home.recommendedProblems")}>
      <PanelHeader
        title={t("home.recommendedProblems")}
        description={t("home.recommendedProblemsDescription")}
        action={
          <LocalizedLink className="text-xs font-medium text-soj-accent hover:underline" href="/problems">
            {t("home.problems")}
          </LocalizedLink>
        }
      />

      {problems.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("home.problem")}</TableHeaderCell>
              <TableHeaderCell className="w-24">{t("home.status")}</TableHeaderCell>
              <TableHeaderCell className="w-20">{t("home.difficulty")}</TableHeaderCell>
              <TableHeaderCell className="w-32 text-right">{t("problems.acceptance")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell className="max-w-0">
                  <LocalizedLink
                    className="block truncate font-medium text-soj-text transition-colors hover:text-soj-accent"
                    href={`/problems/${problem.id}`}
                  >
                    {problem.title}
                  </LocalizedLink>
                </TableCell>
                <TableCell>
                  <ProblemStatus status={problem.status} />
                </TableCell>
                <TableCell>
                  <StatusPill tone={problemDifficultyTone[problem.difficulty]}>
                    {t(problemDifficultyLabelKey[problem.difficulty])}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <AcceptanceMeter value={getAcceptanceRate(problem)} locale={locale} valueClassName="text-xs text-soj-muted" />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState compact icon={ListChecks} title={t("home.noProblems")} />
      )}
    </Panel>
  );
}
