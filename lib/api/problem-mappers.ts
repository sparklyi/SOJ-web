import type { ProblemResponse, ProblemStatementResponse } from "./backend-types";
import type { ProblemDetail, ProblemSummary } from "./types";

const DEFAULT_SOLVE_STATUS = "todo";

export function mapProblemSummary(problem: ProblemResponse): ProblemSummary {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    status: DEFAULT_SOLVE_STATUS,
    acceptedCount: problem.accepted_count,
    submissionCount: problem.submission_count,
  };
}

export function mapProblemDetail(
  problem: ProblemResponse,
  statement: ProblemStatementResponse,
): ProblemDetail {
  return {
    ...mapProblemSummary(problem),
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
