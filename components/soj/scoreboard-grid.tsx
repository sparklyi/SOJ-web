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
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Rank</TableHeaderCell>
          <TableHeaderCell>Handle</TableHeaderCell>
          <TableHeaderCell>{mode === "acm" ? "Solved" : "Score"}</TableHeaderCell>
          <TableHeaderCell>{mode === "acm" ? "Penalty" : "Movement"}</TableHeaderCell>
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
