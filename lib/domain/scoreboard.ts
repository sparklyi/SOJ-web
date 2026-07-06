import type { ContestType } from "@/lib/api/types";

export type ScoreboardProblemStatus = "none" | "pending" | "accepted" | "wrong_answer" | "partial" | "first_blood";

export type ScoreboardProblemCell = {
  problemId: number;
  alias: string;
  status: ScoreboardProblemStatus;
  attempts?: number;
  penalty?: number;
  score?: number;
};

export type AcmScoreboardRow = {
  id: string;
  handle: string;
  solved: number;
  penalty: number;
  movement?: number;
  problems: ScoreboardProblemCell[];
};

export type OiScoreboardRow = {
  id: string;
  handle: string;
  score: number;
  lastImprovedAt: string;
  movement?: number;
  problems: ScoreboardProblemCell[];
};

export type ScoreboardInput =
  | {
      type: "acm";
      rows: AcmScoreboardRow[];
    }
  | {
      type: "oi";
      rows: OiScoreboardRow[];
    };

export type RankedScoreboardRow<T extends AcmScoreboardRow | OiScoreboardRow> = T & {
  rank: number;
};

export type ScoreboardModel =
  | {
      type: "acm";
      rows: Array<RankedScoreboardRow<AcmScoreboardRow>>;
    }
  | {
      type: "oi";
      rows: Array<RankedScoreboardRow<OiScoreboardRow>>;
    };

export function buildScoreboardModel(input: ScoreboardInput): ScoreboardModel {
  if (input.type === "acm") {
    return {
      type: "acm",
      rows: rankRows(
        input.rows,
        (a, b) => b.solved - a.solved || a.penalty - b.penalty || a.handle.localeCompare(b.handle),
        (a, b) => a.solved === b.solved && a.penalty === b.penalty,
      ),
    };
  }

  return {
    type: "oi",
    rows: rankRows(
      input.rows,
      (a, b) => b.score - a.score || Date.parse(b.lastImprovedAt) - Date.parse(a.lastImprovedAt) || a.handle.localeCompare(b.handle),
      (a, b) => a.score === b.score && a.lastImprovedAt === b.lastImprovedAt,
    ),
  };
}

export function getScoreboardColumns(type: ContestType) {
  return type === "acm" ? ["Rank", "Handle", "Solved", "Penalty"] : ["Rank", "Handle", "Score", "Movement"];
}

function rankRows<T extends AcmScoreboardRow | OiScoreboardRow>(rows: T[], compare: (a: T, b: T) => number, sameRank: (a: T, b: T) => boolean) {
  const sorted = [...rows].sort(compare);
  let lastRank = 0;

  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    const rank = previous && sameRank(previous, row) ? lastRank : index + 1;
    lastRank = rank;
    return { ...row, rank };
  });
}
