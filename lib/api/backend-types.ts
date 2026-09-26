import type { ContestRole, Permission, Role } from "@/lib/auth/permissions";

export type Envelope<T> = {
  data?: T;
  error?: BackendError | null;
  request_id?: string;
};

export type BackendError = {
  code: string;
  message: string;
  details?: unknown;
};

export type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type UserRole = Role;
export type UserStatus = "active" | "disabled" | "deleted";

export type UserResponse = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  roles: UserRole[];
  permissions: Permission[];
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserResponse;
};

export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemVisibility = "private" | "public" | "contest_only";
export type ProblemPublicationStatus = "draft" | "in_review" | "changes_requested" | "published" | "archived";

export type ProblemResponse = {
  id: number;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  visibility: ProblemVisibility;
  status: ProblemPublicationStatus;
  tags: string[];
  limits: {
    time_limit_ms: number;
    memory_limit_kb: number;
  };
  // 由后端批量投影得到，不是题目行本身的列：列表页一次请求即携带，
  // 不需要每道题再打一次 /stats。
  submission_count: number;
  accepted_count: number;
  owner_user_id: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
};

export type ProblemStatementResponse = {
  title: string;
  description: string;
  input_description?: string;
  output_description?: string;
  samples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hint?: string;
  source?: string;
  problem_id: number;
  version: number;
  created_at: string;
};

export type ProblemStatsResponse = {
  problem_id: number;
  total_submissions: number;
  accepted_submissions: number;
  status_counts: Record<string, number>;
};

export type TestcaseFindingResponse = {
  severity: "info" | "warning" | "error";
  code: string;
  file?: string | null;
  message: string;
};

export type TestcaseSetResponse = {
  id: number;
  problem_id: number;
  version: number;
  checksum_sha256: string;
  size_bytes: number;
  case_count: number;
  is_current: boolean;
  created_at: string;
};

/** 上传响应内联 warnings，与 GET authoring 的 testcase_set 同构但多一层。 */
export type UploadedTestcaseSetResponse = TestcaseSetResponse & { warnings: TestcaseFindingResponse[] };

export type ProblemCheckResponse = {
  id: number;
  problem_id: number;
  statement_id?: number | null;
  testcase_set_id?: number | null;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  summary: {
    case_count: number;
    finding_count: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    storage_readable: boolean;
    zip_readable: boolean;
    valid: boolean;
  };
  findings: Array<{
    id: number;
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
    case_index?: number | null;
    testcase_key?: string | null;
  }>;
  created_at: string;
};

export type ProblemAuthoringStepResponse = {
  key: "create" | "statement" | "testcase" | "check" | "review";
  status: "done" | "todo";
};

export type ProblemAuthoringFlowResponse = {
  current_step: "create" | "statement" | "testcase" | "check" | "review" | "";
  remaining: number;
  steps: ProblemAuthoringStepResponse[];
};

export type ProblemAuthoringStateResponse = {
  problem: ProblemResponse;
  statement?: ProblemStatementResponse | null;
  testcase_set?: TestcaseSetResponse | null;
  latest_check?: ProblemCheckResponse | null;
  flow: ProblemAuthoringFlowResponse;
  publishable: boolean;
  blockers: Array<{ code: string; message: string; step?: ProblemAuthoringStepResponse["key"] }>;
};

export type LanguageResponse = {
  id: number;
  engine: string;
  engine_language_id: string;
  name: string;
  version?: string | null;
  compile_command?: string | null;
  run_command?: string | null;
  default_time_limit_ms: number;
  default_memory_limit_kb: number;
  enabled: boolean;
};

export type JudgeStatus =
  | "queued"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "memory_limit"
  | "output_limit"
  | "system_error"
  | "canceled";

export type SubmissionResponse = {
  id: number;
  user_id: number;
  problem_id: number;
  contest_id?: number | null;
  language_id: number;
  status: JudgeStatus;
  time_ms?: number | null;
  memory_kb?: number | null;
  error_message?: string | null;
  submitted_at: string;
  judged_at?: string | null;
  updated_at: string;
  visibility?: "visible" | "frozen";
  result?: SubmissionResultSummary;
  cases?: SubmissionCaseSummary[];
  admin_diagnostics?: SubmissionAdminDiagnostics;
};

export type SubmissionSourceResponse = {
  source_code: string;
  language_id: number;
};

export type SubmissionResultSummary = {
  attempt_id: number;
  status: JudgeStatus;
  time_ms?: number | null;
  memory_kb?: number | null;
  first_failed_case_index?: number | null;
  first_failed_group?: string | null;
  error_class?: string | null;
  safe_summary?: Record<string, unknown> | null;
  updated_at: string;
};

export type SubmissionCaseSummary = {
  case_index: number;
  group_name?: string | null;
  status: JudgeStatus;
  time_ms?: number | null;
  memory_kb?: number | null;
  checker_message?: string | null;
  output_diff_summary?: string | null;
};

export type SubmissionAdminDiagnostics = {
  attempt_id: number;
  attempt_no: number;
  protocol_version: string;
  judge_core_version: string;
  judge_engine: string;
  judge_agent_id?: string | null;
  language_runtime?: string | null;
  sandbox_backend?: string | null;
  sandbox_profile?: string | null;
  trace_id?: string | null;
  compile_output_summary?: string | null;
  stderr_summary?: string | null;
  error_class?: string | null;
  error_message?: string | null;
};

export type RunResponse = {
  id: number;
  user_id: number;
  /** 自由运行（练习场）时为 null。 */
  problem_id: number | null;
  language_id: number;
  status: JudgeStatus;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time_ms?: number | null;
  memory_kb?: number | null;
  error_message?: string | null;
  created_at: string;
  finished_at?: string | null;
  updated_at: string;
};

export type ContestVisibility = "public" | "private";
export type BackendContestStatus = "draft" | "published" | "running" | "ended" | "archived";

export type ContestProblem = {
  problem_id: number;
  alias: string;
  sort_order: number;
  title?: string;
};

export type ContestResponse = {
  id: number;
  owner_user_id: number;
  title: string;
  description?: string | null;
  visibility: ContestVisibility;
  status: BackendContestStatus;
  registered: boolean;
  current_user_roles: ContestRole[];
  start_at: string;
  end_at: string;
  freeze_at: string;
  problems: ContestProblem[];
  created_at: string;
  updated_at: string;
};

export type ContestRegistrationResponse = {
  id: number;
  contest_id: number;
  user_id: number;
  display_name: string;
  email: string;
  status: "active" | "canceled";
  registered_at: string;
};

export type ScoreboardResponse = {
  contest_id: number;
  view: "live" | "frozen" | "final";
  generated_at: string;
  problems: ContestProblem[];
  rows: ScoreboardRow[];
  next_cursor?: string;
};

export type ScoreboardRow = {
  rank: number;
  user_id: number;
  display_name: string;
  accepted_count: number;
  penalty_minutes: number;
  cells: ScoreboardCell[];
};

export type ScoreboardCell = {
  problem_id: number;
  alias: string;
  status: "none" | "attempted" | "accepted" | "frozen";
  attempts: number;
  frozen_attempts?: number | null;
  penalty_minutes: number;
  accepted_at?: string | null;
  last_submission_id?: number | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  username: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refresh_token: string;
};

export type SubmissionCreateRequest = {
  problem_id: number;
  language_id: number;
  source_code: string;
  contest_id?: number | null;
};

export type RunCreateRequest = {
  /** 省略即为自由运行：不绑定题目。 */
  problem_id?: number;
  language_id: number;
  source_code: string;
  stdin?: string;
};

export type ContestRegistrationRequest = {
  display_name: string;
  email: string;
  invite_code?: string;
};

export type ProblemReviewQueueResponse = {
  items: ProblemResponse[];
  page: number;
  page_size: number;
  total: number;
};

export type ProblemReviewDecisionRequest = {
  decision: "approve" | "request_changes";
  comment?: string;
};

export type ProblemReviewEventResponse = {
  id: number;
  problem_id: number;
  actor_user_id: number;
  from_status: ProblemPublicationStatus;
  to_status: ProblemPublicationStatus;
  decision: "submit" | "approve" | "request_changes";
  comment?: string | null;
  created_at: string;
};

export type ProblemReviewEventPageResponse = {
  items: ProblemReviewEventResponse[];
};

export type RejudgeBatchStatus = "queued" | "running" | "completed" | "failed" | "canceled";
export type RejudgeItemStatus = "queued" | "running" | "completed" | "failed" | "canceled";

export type RejudgeBatchResponse = {
  id: number;
  problem_id?: number | null;
  contest_id?: number | null;
  requested_by: number;
  status: RejudgeBatchStatus;
  reason: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  canceled_count: number;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type RejudgeBatchItemResponse = {
  id: number;
  batch_id: number;
  submission_id: number;
  task_id: number;
  attempt_id?: number | null;
  status: RejudgeItemStatus;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type RejudgeBatchDetailResponse = {
  batch: RejudgeBatchResponse;
  items: RejudgeBatchItemResponse[];
};

export type RejudgeBatchPageResponse = {
  items: RejudgeBatchResponse[];
  page: number;
  page_size: number;
  total: number;
};

export type RejudgeBatchCreateRequest = {
  problem_id?: number | null;
  contest_id?: number | null;
  reason: string;
};

export type RejudgeBatchCancelRequest = {
  reason: string;
};

export type ContestRoleAssignmentResponse = {
  id: number;
  contest_id: number;
  user_id: number;
  username?: string;
  role: ContestRole;
  granted_by?: number | null;
  granted_at: string;
  revoked_at?: string | null;
};

export type ContestRoleAssignmentPageResponse = {
  items: ContestRoleAssignmentResponse[];
  total: number;
};

export type RoleAssignmentResponse = {
  id: number;
  user_id: number;
  role: Role;
  granted_by?: number | null;
  granted_at: string;
  revoked_at?: string | null;
};

export type UserPageResponse = {
  items: UserResponse[];
  page: number;
  page_size: number;
  total: number;
};

export type UserCursorPageResponse = {
  items: UserResponse[];
  next_cursor?: string;
};

export type AdminUserUpdateRequest = {
  username?: string;
  bio?: string | null;
  status?: UserStatus;
};

export type RoleGrantRequest = {
  role: Role;
  reason: string;
};

export type RoleRevokeRequest = {
  reason: string;
};

export type ContestRoleGrantRequest = {
  user_id: number;
  role: ContestRole;
  reason: string;
};

export type ContestRoleRevokeRequest = {
  reason: string;
};
