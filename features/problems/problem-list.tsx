import type { ProblemSummary } from "@/lib/api/types";
import { Table, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { getServerTranslator } from "@/lib/i18n/server";
import { ProblemRow } from "./problem-row";

type ProblemListProps = {
  problems: ProblemSummary[];
  totalCount: number;
};

export async function ProblemList({ problems, totalCount }: ProblemListProps) {
  const t = await getServerTranslator();

  if (problems.length === 0) {
    return (
      <section className="soj-data-panel p-8">
        <h2 className="text-lg font-semibold text-soj-text">{t("problems.noMatching")}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-soj-muted">
          {t("problems.noMatchingDescription")}
        </p>
      </section>
    );
  }

  return (
    <section className="soj-data-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/55 px-4 py-4 md:px-5">
        <div>
          <h2 className="text-lg font-semibold text-soj-text">{t("problems.inView")}</h2>
          <p className="mt-1 text-sm text-soj-muted">{t("problems.openStatement")}</p>
        </div>
        <div className="rounded-soj-md border border-soj-accent/35 bg-soj-accent/10 px-3 py-1.5 font-mono text-xs text-soj-accent">
          {problems.length}/{totalCount}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("problems.table.problem")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.status")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.difficulty")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.tags")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.acceptance")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.submissions")}</TableHeaderCell>
              <TableHeaderCell>{t("problems.table.action")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {problems.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} t={t} />
            ))}
          </tbody>
        </Table>
      </div>
      <div className="border-t border-soj-line/55 px-4 py-3 font-mono text-xs text-soj-muted">
        {t("problems.readyForPractice", { count: problems.length })}
      </div>
    </section>
  );
}
