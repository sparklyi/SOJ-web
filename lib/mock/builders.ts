import type { ContestSummary, ProblemDetail, SubmissionSummary } from "@/lib/api/types";

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
