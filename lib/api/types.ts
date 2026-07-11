import type { AuthSession } from "@/lib/auth/session";
import type { ScoreboardModel } from "@/lib/domain/scoreboard";

export type ApiMode = "mock" | "http";

export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemStatus = "todo" | "attempted" | "accepted";
export type ProblemPublicationStatus = "draft" | "published" | "archived";
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
  title: string;
  type: ContestType;
  status: ContestStatus;
  startsAt: string;
  endsAt: string;
  freezeAt: string;
  registered: boolean;
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
  contestId?: number;
  status: JudgeStatus;
  score: number;
  timeMs?: number;
  memoryKb?: number;
  submittedAt: string;
};

export type CreateRunInput = {
  problemId: number;
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
  problemId: number;
  languageId: number;
  status: JudgeStatus;
  createdAt: string;
  finishedAt?: string;
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

export type CurrentUser = {
  id: number;
  handle: string;
  displayName: string;
  role: "user" | "admin" | "root";
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
    publish: (id: number) => Promise<AuthoringProblem>;
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
  };
  languages: {
    list: (filter?: { enabled?: boolean; engine?: string }) => Promise<PageResult<JudgeLanguage>>;
  };
};
