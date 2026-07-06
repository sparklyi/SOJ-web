import type { ContestSummary, ProblemDetail, SubmissionSummary } from "@/lib/api/types";
import type { AcmScoreboardRow, OiScoreboardRow } from "@/lib/domain/scoreboard";

export function buildProblem(overrides: Partial<ProblemDetail> = {}): ProblemDetail {
  const id = overrides.id ?? 1;
  return {
    id,
    slug: `signal-path-${id}`,
    title: `Signal Path ${id}`,
    difficulty: "medium",
    tags: ["graphs", "shortest-path"],
    status: "todo",
    acceptedCount: 184 + id,
    submissionCount: 421 + id * 3,
    statement: "Find the lowest cost path through a directed signal network.",
    input: "The first line contains n and m. The next m lines contain weighted directed edges.",
    output: "Print the minimum cost from source to target.",
    examples: [{ input: "4 4\n1 2 5\n2 4 7\n1 3 2\n3 4 4", output: "6" }],
    constraints: ["1 <= n <= 200000", "1 <= m <= 400000"],
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    ...overrides,
  };
}

export function buildContest(overrides: Partial<ContestSummary> = {}): ContestSummary {
  return {
    id: overrides.id ?? 1,
    title: "SOJ Signal Cup",
    type: "acm",
    status: "running",
    startsAt: "2026-07-07T09:00:00Z",
    endsAt: "2026-07-07T14:00:00Z",
    freezeAt: "2026-07-07T13:00:00Z",
    registered: true,
    problems: [
      { problemId: 1, alias: "A", title: "Signal Path 1" },
      { problemId: 2, alias: "B", title: "Cache Relay" },
      { problemId: 3, alias: "C", title: "Frozen Matrix" },
    ],
    ...overrides,
  };
}

export function buildSubmission(overrides: Partial<SubmissionSummary> = {}): SubmissionSummary {
  return {
    id: overrides.id ?? 1,
    problemId: 1,
    problemTitle: "Signal Path 1",
    contestId: 1,
    status: "running",
    score: 0,
    submittedAt: "2026-07-07T10:12:00Z",
    ...overrides,
  };
}

export function buildAcmScoreboardRow(overrides: Partial<AcmScoreboardRow> = {}): AcmScoreboardRow {
  return {
    id: overrides.id ?? "team-1",
    handle: "lin-chen",
    solved: 4,
    penalty: 312,
    movement: 2,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", attempts: 1, penalty: 42 },
      { problemId: 2, alias: "B", status: "wrong_answer", attempts: 2 },
      { problemId: 3, alias: "C", status: "pending", attempts: 1 },
    ],
    ...overrides,
  };
}

export function buildOiScoreboardRow(overrides: Partial<OiScoreboardRow> = {}): OiScoreboardRow {
  return {
    id: overrides.id ?? "team-1",
    handle: "lin-chen",
    score: 420,
    lastImprovedAt: "2026-07-07T10:35:00Z",
    movement: 2,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", score: 100 },
      { problemId: 2, alias: "B", status: "partial", score: 70 },
      { problemId: 3, alias: "C", status: "wrong_answer", score: 0 },
    ],
    ...overrides,
  };
}
