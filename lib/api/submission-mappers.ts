import type { RunResponse, SubmissionResponse } from "./backend-types";
import type { RunSummary, SubmissionAdminDiagnostics, SubmissionCase, SubmissionResult, SubmissionSummary } from "./types";

export function mapSubmissionSummary(input: SubmissionResponse): SubmissionSummary {
  const submission: SubmissionSummary = {
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

  if (input.error_message != null) submission.errorMessage = input.error_message;
  if (input.visibility != null) submission.visibility = input.visibility;
  if (input.result) submission.result = mapSubmissionResult(input.result);
  if (input.cases) submission.cases = input.cases.map(mapSubmissionCase);
  if (input.admin_diagnostics) submission.adminDiagnostics = mapSubmissionDiagnostics(input.admin_diagnostics);

  return submission;
}

function mapSubmissionResult(input: NonNullable<SubmissionResponse["result"]>): SubmissionResult {
  return {
    attemptId: input.attempt_id,
    status: input.status,
    score: input.score,
    timeMs: input.time_ms ?? undefined,
    memoryKb: input.memory_kb ?? undefined,
    firstFailedCaseIndex: input.first_failed_case_index ?? undefined,
    firstFailedGroup: input.first_failed_group ?? undefined,
    errorClass: input.error_class ?? undefined,
    safeSummary: input.safe_summary ?? undefined,
    updatedAt: input.updated_at,
  };
}

function mapSubmissionCase(input: NonNullable<SubmissionResponse["cases"]>[number]): SubmissionCase {
  return {
    caseIndex: input.case_index,
    groupName: input.group_name ?? undefined,
    status: input.status,
    score: input.score,
    timeMs: input.time_ms ?? undefined,
    memoryKb: input.memory_kb ?? undefined,
    checkerMessage: input.checker_message ?? undefined,
    outputDiffSummary: input.output_diff_summary ?? undefined,
  };
}

function mapSubmissionDiagnostics(input: NonNullable<SubmissionResponse["admin_diagnostics"]>): SubmissionAdminDiagnostics {
  return {
    attemptId: input.attempt_id,
    attemptNo: input.attempt_no,
    protocolVersion: input.protocol_version,
    judgeCoreVersion: input.judge_core_version,
    judgeEngine: input.judge_engine,
    judgeAgentId: input.judge_agent_id ?? undefined,
    languageRuntime: input.language_runtime ?? undefined,
    sandboxBackend: input.sandbox_backend ?? undefined,
    sandboxProfile: input.sandbox_profile ?? undefined,
    traceId: input.trace_id ?? undefined,
    compileOutputSummary: input.compile_output_summary ?? undefined,
    stderrSummary: input.stderr_summary ?? undefined,
    errorClass: input.error_class ?? undefined,
    errorMessage: input.error_message ?? undefined,
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
