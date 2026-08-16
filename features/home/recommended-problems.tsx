import { LocalizedLink } from "@/components/i18n/localized-link";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ProblemSummary } from "@/lib/api/types";
import { getServerTranslator } from "@/lib/i18n/server";

type RecommendedProblemsProps = {
  problems: ProblemSummary[];
};

export async function RecommendedProblems({ problems }: RecommendedProblemsProps) {
  const t = await getServerTranslator();
  const difficultyKey = {
    easy: "difficulty.easy",
    medium: "difficulty.medium",
    hard: "difficulty.hard",
  } as const;

  return (
    <section aria-labelledby="recommended-problems-heading" className="grid gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recommended-problems-heading" className="text-xl font-semibold text-soj-text">{t("home.recommendedProblems")}</h2>
        <LocalizedLink className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/problems">{t("home.problems")}</LocalizedLink>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("home.problem")}</TableHeaderCell>
            <TableHeaderCell>{t("home.status")}</TableHeaderCell>
            <TableHeaderCell>{t("home.difficulty")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <tbody>
          {problems.length > 0 ? problems.map((problem) => (
            <TableRow key={problem.id}>
              <TableCell>
                <LocalizedLink className="font-medium text-soj-text hover:text-soj-accent" href={`/problems/${problem.id}`}>{problem.title}</LocalizedLink>
              </TableCell>
              <TableCell><ProblemStatus status={problem.status} /></TableCell>
              <TableCell>
                <StatusPill tone={problem.difficulty === "hard" ? "warning" : problem.difficulty === "medium" ? "info" : "success"}>
                  {t(difficultyKey[problem.difficulty])}
                </StatusPill>
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={3} className="text-sm text-soj-muted">{t("home.noProblems")}</TableCell></TableRow>}
        </tbody>
      </Table>
    </section>
  );
}
