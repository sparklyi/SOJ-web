export type Envelope<T> = {
  data?: T;
  error?: BackendError | null;
  request_id?: string;
};

export type BackendError = {
  code: string;
  message: string;
};

export type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type UserRole = "user" | "admin" | "root";
export type UserStatus = "active" | "disabled" | "deleted";

export type UserResponse = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  role: UserRole;
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
export type ProblemPublicationStatus = "draft" | "published" | "archived";

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

export type TestcaseSetResponse = {
  id: number;
  problem_id: number;
  version: number;
  checksum_sha256: string;
  size_bytes: number;
  case_count: number;
  status: "uploading" | "ready" | "disabled";
  is_current: boolean;
  created_at: string;
};

export type ProblemCheckResponse = {
  id: number;
  problem_id: number;
  statement_id?: number | null;
  testcase_set_id?: number | null;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  summary: {
    case_count: number;
    expected_case_count: number;
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
};

export type ProblemAuthoringStateResponse = {
  problem: ProblemResponse;
  statement?: ProblemStatementResponse | null;
  testcase_set?: TestcaseSetResponse | null;
  latest_check?: ProblemCheckResponse | null;
  publishable: boolean;
  blockers: Array<{ code: string; message: string }>;
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
  | "system_error"
  | "canceled";

export type SubmissionResponse = {
  id: number;
  user_id: number;
  problem_id: number;
  contest_id?: number | null;
  language_id: number;
  status: JudgeStatus;
  score: number;
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

export type SubmissionResultSummary = {
  attempt_id: number;
  status: JudgeStatus;
  score: number;
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
  score: number;
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
  problem_id: number;
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
  scoring_mode: "acm";
  registered: boolean;
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
  problem_id: number;
  language_id: number;
  source_code: string;
  stdin?: string;
};

export type ContestRegistrationRequest = {
  display_name: string;
  email: string;
  invite_code?: string;
};
