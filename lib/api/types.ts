import type { AuthSession } from "@/lib/auth/session";
import type { ScoreboardModel } from "@/lib/domain/scoreboard";
import type { ContestRole, GlobalRole, Permission, Role } from "@/lib/auth/permissions";

export type ApiMode = "mock" | "http";

export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemStatus = "todo" | "attempted" | "accepted";
export type ProblemPublicationStatus = "draft" | "in_review" | "changes_requested" | "published" | "archived";
export type ProblemVisibility = "private" | "public" | "contest_only";

export type ProblemSummary = {
  id: number;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  status: ProblemStatus;
  acceptedCount: number;
  submissionCount: number;
};

export type ProblemDetail = ProblemSummary & {
  statement: string;
  input: string;
  output: string;
  examples: Array<{ input: string; output: string }>;
  constraints: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
};

export type AuthoringProblem = {
  id: number;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  visibility: ProblemVisibility;
  publicationStatus: ProblemPublicationStatus;
  tags: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
  ownerUserId: number;
};

export type ProblemCreateInput = Omit<AuthoringProblem, "id" | "publicationStatus" | "ownerUserId">;
export type ProblemUpdateInput = Partial<Omit<ProblemCreateInput, "difficulty" | "visibility">> & {
  difficulty?: ProblemDifficulty;
  visibility?: ProblemVisibility;
};

export type ProblemStatementInput = {
  title: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  samples: Array<{ input: string; output: string; explanation?: string }>;
  hint: string;
  source: string;
};

export type AuthoringStatement = ProblemStatementInput & {
  problemId: number;
  version: number;
};

export type AuthoringTestcaseSet = {
  id: number;
  problemId: number;
  version: number;
  checksumSha256: string;
  sizeBytes: number;
  caseCount: number;
  status: "uploading" | "ready" | "disabled";
  isCurrent: boolean;
};

export type ProblemCheckFinding = {
  id: number;
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  caseIndex?: number;
  testcaseKey?: string;
};

export type ProblemCheckRun = {
  id: number;
  problemId: number;
  statementId?: number;
  testcaseSetId?: number;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  summary: {
    caseCount: number;
    expectedCaseCount: number;
    findingCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    storageReadable: boolean;
    zipReadable: boolean;
    valid: boolean;
  };
  findings: ProblemCheckFinding[];
};

export type ProblemAuthoringState = {
  problem: AuthoringProblem;
  statement?: AuthoringStatement;
  testcaseSet?: AuthoringTestcaseSet;
  latestCheck?: ProblemCheckRun;
  publishable: boolean;
  blockers: Array<{ code: string; message: string }>;
};

export type ContestType = "acm" | "oi";
export type ContestStatus = "scheduled" | "running" | "frozen" | "ended" | "unsealed";

export type ContestSummary = {
  id: number;
  ownerUserId: number;
  title: string;
  type: ContestType;
  status: ContestStatus;
  startsAt: string;
  endsAt: string;
  freezeAt: string;
  registered: boolean;
  currentUserRoles: ContestRole[];
  problems: Array<{ problemId: number; alias: string; title: string }>;
};

export type ContestRegistrationInput = {
  displayName: string;
  email: string;
  inviteCode?: string;
};

export type ContestRegistration = {
  id: number;
  contestId: number;
  userId: number;
  displayName: string;
  email: string;
  status: "active" | "canceled";
  registeredAt: string;
};

export type JudgeStatus =
  | "queued"
  | "compiling"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "compile_error"
  | "time_limit"
  | "memory_limit"
  | "canceled"
  | "system_error";

export type CreateSubmissionInput = {
  problemId: number;
  contestId?: number;
  languageId: number;
  sourceCode: string;
};

export type SubmissionSummary = {
  id: number;
  problemId: number;
  problemTitle: string;
  contestTitle?: string;
  contestId?: number;
  status: JudgeStatus;
  score: number;
  timeMs?: number;
  memoryKb?: number;
  errorMessage?: string;
  visibility?: "visible" | "frozen";
  result?: SubmissionResult;
  cases?: SubmissionCase[];
  adminDiagnostics?: SubmissionAdminDiagnostics;
  contestImpact?: {
    penalty?: string;
    rankMovement?: string;
  };
  submittedAt: string;
};

export type SubmissionResult = {
  attemptId: number;
  status: JudgeStatus;
  score: number;
  timeMs?: number;
  memoryKb?: number;
  firstFailedCaseIndex?: number;
  firstFailedGroup?: string;
  errorClass?: string;
  safeSummary?: Record<string, unknown>;
  updatedAt: string;
};

export type SubmissionCase = {
  caseIndex: number;
  groupName?: string;
  status: JudgeStatus;
  score: number;
  timeMs?: number;
  memoryKb?: number;
  checkerMessage?: string;
  outputDiffSummary?: string;
};

export type SubmissionAdminDiagnostics = {
  attemptId: number;
  attemptNo: number;
  protocolVersion: string;
  judgeCoreVersion: string;
  judgeEngine: string;
  judgeAgentId?: string;
  languageRuntime?: string;
  sandboxBackend?: string;
  sandboxProfile?: string;
  traceId?: string;
  compileOutputSummary?: string;
  stderrSummary?: string;
  errorClass?: string;
  errorMessage?: string;
};

export type CreateRunInput = {
  /**
   * 省略即为自由运行（练习场）：不绑定任何题目，服务端也不做题目校验。
   * `JSON.stringify` 会丢掉值为 `undefined` 的键，所以省略它时请求体里
   * 真的不会有 `problem_id`——这条行为有测试盯着，别改成显式构造 body。
   */
  problemId?: number;
  languageId: number;
  sourceCode: string;
  stdin?: string;
};

export type RunResult = {
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  errorMessage?: string;
  timeMs?: number;
  memoryKb?: number;
};

export type RunSummary = RunResult & {
  id: number;
  /** 自由运行（练习场）时为 undefined。 */
  problemId?: number;
  languageId: number;
  status: JudgeStatus;
  createdAt: string;
  finishedAt?: string;
};

/** 站级聚合：题目数（公开已发布）、提交数、语言数（已启用）。 */
export type SiteFacts = {
  problems: number;
  submissions: number;
  languages: number;
};

export type JudgeLanguage = {
  id: number;
  engine: string;
  engineLanguageId: string;
  name: string;
  version?: string;
  compileCommand?: string;
  runCommand?: string;
  defaultTimeLimitMs: number;
  defaultMemoryLimitKb: number;
  enabled: boolean;
};

export type ReviewDecision = "approve" | "request_changes";

export type ProblemReviewEvent = {
  id: number;
  problemId: number;
  actorUserId: number;
  fromStatus: ProblemPublicationStatus;
  toStatus: ProblemPublicationStatus;
  decision: "submit" | "approve" | "request_changes";
  comment?: string;
  createdAt: string;
};

export type RejudgeBatchStatus = "queued" | "running" | "completed" | "failed" | "canceled";

export type RejudgeBatch = {
  id: number;
  problemId?: number;
  contestId?: number;
  requestedBy: number;
  status: RejudgeBatchStatus;
  reason: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  canceledCount: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RejudgeBatchItem = {
  id: number;
  batchId: number;
  submissionId: number;
  taskId: number;
  attemptId?: number;
  status: RejudgeBatchStatus;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type RejudgeBatchDetail = {
  batch: RejudgeBatch;
  items: RejudgeBatchItem[];
};

export type ContestRoleAssignment = {
  id: number;
  contestId: number;
  userId: number;
  username?: string;
  role: ContestRole;
  grantedBy?: number;
  grantedAt: string;
};

export type GlobalRoleAssignment = {
  id: number;
  userId: number;
  role: GlobalRole;
  grantedBy?: number;
  grantedAt: string;
};

export type AdminUserStatus = "active" | "disabled" | "deleted";

export type AdminUser = {
  id: number;
  email: string;
  handle: string;
  status: AdminUserStatus;
  roles: GlobalRole[];
  createdAt: string;
  updatedAt: string;
};

export type CurrentUser = {
  id: number;
  handle: string;
  displayName: string;
  roles: Role[];
  permissions: Permission[];
};

export type PageResult<T> = {
  items: T[];
  total: number;
};

export type ApiClient = {
  auth: {
    login: (input: { email: string; password: string }) => Promise<AuthSession>;
    register: (input: { email: string; username: string; password: string }) => Promise<AuthSession>;
    refresh: (input: { refreshToken: string }) => Promise<AuthSession>;
    logout: (input?: { refreshToken?: string }) => Promise<void>;
    me: () => Promise<CurrentUser | null>;
  };
  problems: {
    list: () => Promise<PageResult<ProblemSummary>>;
    get: (id: number) => Promise<ProblemDetail>;
    listMine: () => Promise<PageResult<AuthoringProblem>>;
    create: (input: ProblemCreateInput) => Promise<AuthoringProblem>;
    update: (id: number, input: ProblemUpdateInput) => Promise<AuthoringProblem>;
    saveStatement: (id: number, input: ProblemStatementInput) => Promise<AuthoringStatement>;
    uploadTestcases: (id: number, input: { archive: File; caseCount: number }) => Promise<AuthoringTestcaseSet>;
    getAuthoringState: (id: number) => Promise<ProblemAuthoringState>;
    runCheck: (id: number) => Promise<ProblemCheckRun>;
    submitReview: (id: number) => Promise<AuthoringProblem>;
    reviewQueue: () => Promise<PageResult<AuthoringProblem>>;
    decideReview: (id: number, input: { decision: ReviewDecision; comment?: string }) => Promise<AuthoringProblem>;
    reviewEvents: (id: number) => Promise<ProblemReviewEvent[]>;
  };
  submissions: {
    list: () => Promise<PageResult<SubmissionSummary>>;
    get: (id: number) => Promise<SubmissionSummary>;
    create: (input: CreateSubmissionInput) => Promise<SubmissionSummary>;
  };
  runs: {
    create: (input: CreateRunInput) => Promise<RunSummary>;
    get: (id: number) => Promise<RunSummary>;
  };
  contests: {
    list: () => Promise<PageResult<ContestSummary>>;
    get: (id: number) => Promise<ContestSummary>;
    register: (id: number, input: ContestRegistrationInput) => Promise<ContestRegistration>;
    scoreboard: (id: number) => Promise<ScoreboardModel>;
    listRoles: (id: number) => Promise<ContestRoleAssignment[]>;
    grantRole: (id: number, input: { userId: number; role: ContestRole; reason: string }) => Promise<ContestRoleAssignment>;
    revokeRole: (id: number, input: { userId: number; role: ContestRole; reason: string }) => Promise<void>;
  };
  languages: {
    list: (filter?: { enabled?: boolean; engine?: string }) => Promise<PageResult<JudgeLanguage>>;
  };
  stats: {
    /** 站级聚合（首页三数），后端 Redis 缓存 + 写路径刷新。 */
    site: () => Promise<SiteFacts>;
  };
  rejudge: {
    list: (filter?: { problemId?: number; contestId?: number; status?: RejudgeBatchStatus }) => Promise<PageResult<RejudgeBatch>>;
    create: (input: { problemId?: number; contestId?: number; reason: string }) => Promise<RejudgeBatch>;
    get: (id: number) => Promise<RejudgeBatchDetail>;
    cancel: (id: number, input: { reason: string }) => Promise<RejudgeBatch>;
  };
  admin: {
    listUsers: (filter?: { keyword?: string; status?: AdminUserStatus; page?: number; pageSize?: number }) => Promise<PageResult<AdminUser>>;
    updateUser: (id: number, input: { username?: string; bio?: string | null; status?: AdminUserStatus }) => Promise<AdminUser>;
    grantRole: (id: number, input: { role: GlobalRole; reason: string }) => Promise<GlobalRoleAssignment>;
    revokeRole: (id: number, input: { role: GlobalRole; reason: string }) => Promise<void>;
  };
};
