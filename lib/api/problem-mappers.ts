import type { ProblemResponse, ProblemStatementResponse, ProblemStatsResponse } from "./backend-types";
import type { ProblemDetail, ProblemSummary } from "./types";

const DEFAULT_SOLVE_STATUS = "todo";

export function mapProblemSummary(problem: ProblemResponse, stats?: ProblemStatsResponse): ProblemSummary {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    status: DEFAULT_SOLVE_STATUS,
    acceptedCount: stats?.accepted_submissions ?? 0,
    submissionCount: stats?.total_submissions ?? 0,
  };
}

export function mapProblemDetail(
  problem: ProblemResponse,
  statement: ProblemStatementResponse,
  stats: ProblemStatsResponse,
): ProblemDetail {
  return {
    ...mapProblemSummary(problem, stats),
    statement: statement.description,
    input: statement.input_description ?? "",
    output: statement.output_description ?? "",
    examples: statement.samples.map((sample) => ({
      input: sample.input,
      output: sample.output,
    })),
    constraints: deriveConstraints(problem),
    timeLimitMs: problem.limits.time_limit_ms,
    memoryLimitKb: problem.limits.memory_limit_kb,
  };
}

function deriveConstraints(problem: ProblemResponse) {
  return [
    `Time limit: ${problem.limits.time_limit_ms} ms`,
    `Memory limit: ${problem.limits.memory_limit_kb} KB`,
    ...problem.tags.map((tag) => `Tag: ${tag}`),
  ];
}
