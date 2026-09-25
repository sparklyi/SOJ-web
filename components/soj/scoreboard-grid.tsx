"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";

export type ScoreboardGridRow = {
  id: string;
  rank: number;
  handle: string;
  solved: number;
  penalty: number;
};

export function ScoreboardGrid({ rows }: { rows: ScoreboardGridRow[] }) {
  const { t } = useI18n();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("scoreboard.rank")}</TableHeaderCell>
          <TableHeaderCell>{t("scoreboard.handle")}</TableHeaderCell>
          <TableHeaderCell>{t("scoreboard.solved")}</TableHeaderCell>
          <TableHeaderCell>{t("scoreboard.penalty")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-soj-text">{row.rank}</TableCell>
            <TableCell>{row.handle}</TableCell>
            <TableCell className="font-mono text-soj-accent">{row.solved}</TableCell>
            <TableCell className="font-mono">{row.penalty}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
