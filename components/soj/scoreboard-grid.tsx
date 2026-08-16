"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { RankMovement } from "./rank-movement";

export type ScoreboardGridRow = {
  id: string;
  rank: number;
  handle: string;
  solved?: number;
  penalty?: number;
  score?: number;
  movement?: number;
};

export function ScoreboardGrid({ rows, mode }: { rows: ScoreboardGridRow[]; mode: "acm" | "oi" }) {
  const { t } = useI18n();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("scoreboard.rank")}</TableHeaderCell>
          <TableHeaderCell>{t("scoreboard.handle")}</TableHeaderCell>
          <TableHeaderCell>{t(mode === "acm" ? "scoreboard.solved" : "scoreboard.score")}</TableHeaderCell>
          <TableHeaderCell>{t(mode === "acm" ? "scoreboard.penalty" : "scoreboard.movement")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-soj-text">{row.rank}</TableCell>
            <TableCell>{row.handle}</TableCell>
            <TableCell className="font-mono text-soj-accent">{mode === "acm" ? row.solved : row.score}</TableCell>
            <TableCell className="font-mono">{mode === "acm" ? row.penalty : <RankMovement delta={row.movement ?? 0} />}</TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
