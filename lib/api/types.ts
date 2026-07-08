import type { AuthSession } from "@/lib/auth/session";

export type ApiMode = "mock" | "http";

export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemStatus = "todo" | "attempted" | "accepted";

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

export type JudgeStatus =
  | "queued"
  | "compiling"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "compile_error"
  | "system_error";

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
  };
  submissions: {
    list: () => Promise<PageResult<SubmissionSummary>>;
    get: (id: number) => Promise<SubmissionSummary>;
  };
  contests: {
    list: () => Promise<PageResult<ContestSummary>>;
    get: (id: number) => Promise<ContestSummary>;
  };
  languages: {
    list: (filter?: { enabled?: boolean; engine?: string }) => Promise<PageResult<JudgeLanguage>>;
  };
};
