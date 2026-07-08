import type { RunResponse, SubmissionResponse } from "./backend-types";
import type { RunSummary, SubmissionSummary } from "./types";

export function mapSubmissionSummary(input: SubmissionResponse): SubmissionSummary {
  return {
    id: input.id,
    problemId: input.problem_id,
    problemTitle: `Problem #${input.problem_id}`,
    contestId: input.contest_id ?? undefined,
    status: input.status,
    score: input.score,
    timeMs: input.time_ms ?? undefined,
    memoryKb: input.memory_kb ?? undefined,
    submittedAt: input.submitted_at,
  };
}

export function mapRunSummary(input: RunResponse): RunSummary {
  return {
    id: input.id,
    problemId: input.problem_id,
    languageId: input.language_id,
    status: input.status,
    stdout: input.stdout ?? undefined,
    stderr: input.stderr ?? undefined,
    compileOutput: input.compile_output ?? undefined,
    errorMessage: input.error_message ?? undefined,
    timeMs: input.time_ms ?? undefined,
    memoryKb: input.memory_kb ?? undefined,
    createdAt: input.created_at,
    finishedAt: input.finished_at ?? undefined,
  };
}
