import type { ContestRegistrationResponse, ContestResponse, ScoreboardCell, ScoreboardResponse } from "./backend-types";
import type { ContestRegistration, ContestStatus, ContestSummary } from "./types";
import type { ScoreboardModel, ScoreboardProblemCell, ScoreboardProblemStatus } from "@/lib/domain/scoreboard";

export function mapContestResponse(input: ContestResponse, now: Date = new Date()): ContestSummary {
  return {
    id: input.id,
    title: input.title,
    type: "acm",
    status: mapContestStatus(input, now),
    startsAt: input.start_at,
    endsAt: input.end_at,
    freezeAt: input.freeze_at,
    registered: false,
    problems: [...input.problems]
      .sort((a, b) => a.sort_order - b.sort_order || a.alias.localeCompare(b.alias))
      .map((problem) => ({
        problemId: problem.problem_id,
        alias: problem.alias,
        title: `Problem ${problem.alias}`,
      })),
  };
}

export function mapContestRegistration(input: ContestRegistrationResponse): ContestRegistration {
  return {
    id: input.id,
    contestId: input.contest_id,
    userId: input.user_id,
    displayName: input.display_name,
    email: input.email,
    status: input.status,
    registeredAt: input.registered_at,
  };
}

export function mapContestScoreboard(input: ScoreboardResponse): ScoreboardModel {
  return {
    type: "acm",
    rows: input.rows.map((row) => ({
      rank: row.rank,
      id: String(row.user_id),
      handle: row.display_name,
      solved: row.accepted_count,
      penalty: row.penalty_minutes,
      problems: row.cells.map(mapScoreboardCell),
    })),
  };
}

function mapContestStatus(input: ContestResponse, now: Date): ContestStatus {
  switch (input.status) {
    case "draft":
      return "ended";
    case "published":
      return "scheduled";
    case "running":
      return isFrozen(input, now) ? "frozen" : "running";
    case "ended":
      return "ended";
    case "archived":
      return "unsealed";
  }
}

function isFrozen(input: ContestResponse, now: Date) {
  const current = now.getTime();
  const freezeAt = Date.parse(input.freeze_at);
  const endAt = Date.parse(input.end_at);

  return Number.isFinite(freezeAt) && Number.isFinite(endAt) && freezeAt <= current && current < endAt;
}

function mapScoreboardCell(input: ScoreboardCell): ScoreboardProblemCell {
  return {
    problemId: input.problem_id,
    alias: input.alias,
    status: mapScoreboardCellStatus(input.status),
    attempts: input.attempts,
    penalty: input.penalty_minutes,
  };
}

function mapScoreboardCellStatus(status: ScoreboardCell["status"]): ScoreboardProblemStatus {
  switch (status) {
    case "none":
      return "none";
    case "attempted":
      return "wrong_answer";
    case "accepted":
      return "accepted";
    case "frozen":
      return "pending";
  }
}
