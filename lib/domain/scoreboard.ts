export type ScoreboardProblemStatus = "none" | "pending" | "accepted" | "wrong_answer";

export type ScoreboardProblemCell = {
  problemId: number;
  alias: string;
  status: ScoreboardProblemStatus;
  attempts?: number;
  penalty?: number;
};

export type AcmScoreboardRow = {
  id: string;
  handle: string;
  solved: number;
  penalty: number;
  movement?: number;
  problems: ScoreboardProblemCell[];
};

export type RankedScoreboardRow = AcmScoreboardRow & {
  rank: number;
};

export type ScoreboardModel = {
  rows: RankedScoreboardRow[];
  view?: "live" | "frozen" | "final";
  nextCursor?: string;
};

/** 榜单只有一个赛制：ACM（题数 + 罚时）。排序与并列规则集中在这里。 */
export function buildAcmScoreboard(rows: AcmScoreboardRow[]): ScoreboardModel {
  return {
    rows: rankRows(
      rows,
      (a, b) => b.solved - a.solved || a.penalty - b.penalty || a.handle.localeCompare(b.handle),
      (a, b) => a.solved === b.solved && a.penalty === b.penalty,
    ),
  };
}

function rankRows<T extends AcmScoreboardRow>(
  rows: T[],
  compare: (a: T, b: T) => number,
  sameRank: (a: T, b: T) => boolean,
) {
  const sorted = [...rows].sort(compare);
  let lastRank = 0;

  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    const rank = previous && sameRank(previous, row) ? lastRank : index + 1;
    lastRank = rank;
    return { ...row, rank };
  });
}
