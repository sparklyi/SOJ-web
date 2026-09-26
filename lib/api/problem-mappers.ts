import type {
  ProblemAuthoringFlowResponse,
  ProblemAuthoringStateResponse,
  ProblemCheckResponse,
  ProblemResponse,
  ProblemStatementResponse,
  TestcaseFindingResponse,
  TestcaseSetResponse,
  UploadedTestcaseSetResponse,
} from "./backend-types";
import type {
  AuthoringProblem,
  AuthoringStatement,
  AuthoringTestcaseSet,
  ProblemAuthoringFlow,
  ProblemAuthoringState,
  ProblemCheckRun,
  ProblemDetail,
  ProblemSummary,
  TestcaseFinding,
  UploadedTestcaseSet,
} from "./types";

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

export function mapAuthoringProblem(input: ProblemResponse): AuthoringProblem {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    difficulty: input.difficulty,
    visibility: input.visibility,
    publicationStatus: input.status,
    tags: input.tags,
    timeLimitMs: input.limits.time_limit_ms,
    memoryLimitKb: input.limits.memory_limit_kb,
    ownerUserId: input.owner_user_id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}

export function mapAuthoringStatement(input: ProblemStatementResponse): AuthoringStatement {
  return {
    problemId: input.problem_id,
    version: input.version,
    title: input.title,
    description: input.description,
    inputDescription: input.input_description ?? "",
    outputDescription: input.output_description ?? "",
    samples: input.samples,
    hint: input.hint ?? "",
    source: input.source ?? "",
  };
}

export function mapTestcaseSet(input: TestcaseSetResponse): AuthoringTestcaseSet {
  return {
    id: input.id,
    problemId: input.problem_id,
    version: input.version,
    checksumSha256: input.checksum_sha256,
    sizeBytes: input.size_bytes,
    caseCount: input.case_count,
    isCurrent: input.is_current,
    createdAt: input.created_at,
  };
}

export function mapTestcaseFinding(input: TestcaseFindingResponse): TestcaseFinding {
  const finding: TestcaseFinding = {
    severity: input.severity,
    code: input.code,
    message: input.message,
  };
  if (input.file) finding.file = input.file;
  return finding;
}

export function mapUploadedTestcaseSet(input: UploadedTestcaseSetResponse): UploadedTestcaseSet {
  // 后端对空 warnings 用 omitempty，字段可能整个缺席。
  return { ...mapTestcaseSet(input), warnings: (input.warnings ?? []).map(mapTestcaseFinding) };
}

export function mapProblemCheck(input: ProblemCheckResponse): ProblemCheckRun {
  return {
    id: input.id,
    problemId: input.problem_id,
    statementId: input.statement_id ?? undefined,
    testcaseSetId: input.testcase_set_id ?? undefined,
    status: input.status,
    summary: {
      caseCount: input.summary.case_count,
      findingCount: input.summary.finding_count,
      errorCount: input.summary.error_count,
      warningCount: input.summary.warning_count,
      infoCount: input.summary.info_count,
      storageReadable: input.summary.storage_readable,
      zipReadable: input.summary.zip_readable,
      valid: input.summary.valid,
    },
    findings: input.findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      code: finding.code,
      message: finding.message,
      caseIndex: finding.case_index ?? undefined,
      testcaseKey: finding.testcase_key ?? undefined,
    })),
    createdAt: input.created_at,
  };
}

export function mapAuthoringFlow(input: ProblemAuthoringFlowResponse): ProblemAuthoringFlow {
  return {
    currentStep: input.current_step,
    remaining: input.remaining,
    steps: input.steps.map((step) => ({ key: step.key, status: step.status })),
  };
}

export function mapAuthoringState(input: ProblemAuthoringStateResponse): ProblemAuthoringState {
  return {
    problem: mapAuthoringProblem(input.problem),
    statement: input.statement ? mapAuthoringStatement(input.statement) : undefined,
    testcaseSet: input.testcase_set ? mapTestcaseSet(input.testcase_set) : undefined,
    latestCheck: input.latest_check ? mapProblemCheck(input.latest_check) : undefined,
    flow: mapAuthoringFlow(input.flow),
    publishable: input.publishable,
    blockers: input.blockers.map((blocker) =>
      blocker.step ? { code: blocker.code, message: blocker.message, step: blocker.step } : { code: blocker.code, message: blocker.message },
    ),
  };
}

function deriveConstraints(problem: ProblemResponse) {
  return [
    `Time limit: ${problem.limits.time_limit_ms} ms`,
    `Memory limit: ${problem.limits.memory_limit_kb} KB`,
    ...problem.tags.map((tag) => `Tag: ${tag}`),
  ];
}
