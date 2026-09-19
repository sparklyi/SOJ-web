import type {
  AdminUser,
  ContestRoleAssignment,
  ContestSummary,
  CurrentUser,
  JudgeLanguage,
  ProblemDetail,
  ProblemReviewEvent,
  RejudgeBatch,
  RejudgeBatchItem,
  SubmissionSummary,
} from "@/lib/api/types";
import { permissionsForRoles } from "@/lib/auth/permissions";
import { buildAcmScoreboardRow, buildContest, buildOiScoreboardRow, buildProblem, buildSubmission } from "./builders";

export const mockUser: CurrentUser = {
  id: 7,
  handle: "lin-chen",
  displayName: "Lin Chen",
  roles: ["user"],
  permissions: permissionsForRoles("user"),
};

export const mockAuthorUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "author"],
  permissions: permissionsForRoles("user", "author"),
};

export const mockReviewerUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "reviewer"],
  permissions: permissionsForRoles("user", "reviewer"),
};

export const mockOperatorUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "operator"],
  permissions: permissionsForRoles("user", "operator"),
};

export const mockAdminUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "admin"],
  permissions: permissionsForRoles("user", "admin"),
};

export const mockRootUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "root"],
  permissions: permissionsForRoles("user", "root"),
};

export const mockContestManagerUser: CurrentUser = {
  ...mockUser,
  roles: ["user", "contest_manager"],
  permissions: permissionsForRoles("user", "contest_manager"),
};

export const mockProblems: ProblemDetail[] = [
  buildProblem({ id: 1, title: "Signal Path", difficulty: "easy", status: "accepted", tags: ["graphs"] }),
  buildProblem({ id: 2, title: "Cache Relay", difficulty: "medium", status: "attempted", tags: ["dp"] }),
  buildProblem({ id: 3, title: "Frozen Matrix", difficulty: "hard", tags: ["matrix", "optimization"] }),
  buildProblem({ id: 4, title: "Judge Queue", difficulty: "medium", tags: ["simulation"] }),
  buildProblem({ id: 5, title: "Rank Delta", difficulty: "hard", tags: ["data-structures"] }),
  buildProblem({ id: 6, title: "Binary Beacon", difficulty: "easy", tags: ["bitmask"] }),
  buildProblem({ id: 7, title: "Memory Gate", difficulty: "medium", tags: ["greedy"] }),
  buildProblem({ id: 8, title: "Arena Clock", difficulty: "hard", tags: ["math"] }),
];

export const mockContests: ContestSummary[] = [
  buildContest({ id: 1, title: "SOJ Signal Cup", type: "acm", status: "running" }),
  buildContest({ id: 2, title: "OI Calibration Round", type: "oi", status: "frozen", registered: false }),
];

export const mockSubmissions: SubmissionSummary[] = [
  buildSubmission({ id: 1, status: "queued", score: 0 }),
  buildSubmission({ id: 2, status: "compiling", score: 0 }),
  buildSubmission({ id: 3, status: "running", score: 0 }),
  buildSubmission({ id: 4, status: "accepted", score: 100, timeMs: 42, memoryKb: 8192 }),
  buildSubmission({
    id: 5,
    status: "wrong_answer",
    score: 35,
    timeMs: 39,
    memoryKb: 8192,
    result: {
      attemptId: 105,
      status: "wrong_answer",
      score: 35,
      firstFailedCaseIndex: 4,
      updatedAt: "2026-07-07T10:12:39Z",
    },
    cases: Array.from({ length: 8 }, (_, index) => ({
      caseIndex: index + 1,
      status: (index < 3 ? "accepted" : index === 3 ? "wrong_answer" : "queued") as "accepted" | "wrong_answer" | "queued",
      score: index < 3 ? 10 : index === 3 ? 5 : 0,
    })),
    contestImpact: { penalty: "+20 min", rankMovement: "Pending" },
  }),
  buildSubmission({ id: 6, status: "runtime_error", score: 0, timeMs: 12, memoryKb: 4096 }),
  buildSubmission({ id: 7, status: "compile_error", score: 0 }),
  buildSubmission({ id: 8, status: "system_error", score: 0 }),
];

export const mockLanguages: JudgeLanguage[] = [
  {
    id: 54,
    engine: "soj-agent",
    engineLanguageId: "cpp17",
    name: "C++17",
    version: "17",
    compileCommand: "g++ -std=c++17 -O2 -pipe -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 1000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
  {
    id: 60,
    engine: "soj-agent",
    engineLanguageId: "go",
    name: "Go",
    version: "1.24",
    compileCommand: "go build -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 1000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
];

export const mockProblemsAwaitingReview = ["Cache Relay", "Frozen Matrix"];

export const mockReviewEvents: ProblemReviewEvent[] = [
  {
    id: 2,
    problemId: 2,
    actorUserId: 7,
    fromStatus: "changes_requested",
    toStatus: "in_review",
    decision: "submit",
    comment: "Added the missing constraint and pushed the fixed testcase set.",
    createdAt: "2026-07-07T10:20:00Z",
  },
  {
    id: 1,
    problemId: 2,
    actorUserId: 21,
    fromStatus: "in_review",
    toStatus: "changes_requested",
    decision: "request_changes",
    comment: "Sample 2 contradicts the stated output format.",
    createdAt: "2026-07-07T09:41:00Z",
  },
];

export const mockContestRoleAssignments: ContestRoleAssignment[] = [
  { id: 1, contestId: 1, userId: 21, username: "noa-weiss", role: "contest_manager", grantedBy: 7, grantedAt: "2026-07-07T09:10:00Z" },
  { id: 2, contestId: 1, userId: 33, username: "ravi-menon", role: "contest_judge", grantedBy: 7, grantedAt: "2026-07-07T09:12:00Z" },
  { id: 3, contestId: 1, userId: 12, username: "aya-sato", role: "contest_staff", grantedBy: 7, grantedAt: "2026-07-07T09:15:00Z" },
];

export const mockAdminUsers: AdminUser[] = [
  { id: 7, email: "lin.chen@soj.dev", handle: "lin-chen", status: "active", roles: ["user"], createdAt: "2026-06-01T09:00:00Z", updatedAt: "2026-06-01T09:00:00Z" },
  { id: 12, email: "aya.sato@soj.dev", handle: "aya-sato", status: "active", roles: ["user", "author"], createdAt: "2026-06-02T09:00:00Z", updatedAt: "2026-06-20T09:00:00Z" },
  { id: 21, email: "noa.weiss@soj.dev", handle: "noa-weiss", status: "active", roles: ["user", "reviewer"], createdAt: "2026-06-03T09:00:00Z", updatedAt: "2026-06-21T09:00:00Z" },
  { id: 33, email: "ravi.menon@soj.dev", handle: "ravi-menon", status: "disabled", roles: ["user", "admin"], createdAt: "2026-06-04T09:00:00Z", updatedAt: "2026-07-01T09:00:00Z" },
];

export const mockRejudgeBatches: RejudgeBatch[] = [
  {
    id: 2,
    contestId: 1,
    requestedBy: 7,
    status: "running",
    reason: "Recompute after the freeze unseal fix.",
    totalCount: 40,
    completedCount: 17,
    failedCount: 1,
    canceledCount: 0,
    startedAt: "2026-07-07T10:00:00Z",
    createdAt: "2026-07-07T09:58:00Z",
    updatedAt: "2026-07-07T10:02:00Z",
  },
  {
    id: 1,
    problemId: 2,
    requestedBy: 7,
    status: "completed",
    reason: "Checker fix for the empty-input case.",
    totalCount: 12,
    completedCount: 12,
    failedCount: 0,
    canceledCount: 0,
    startedAt: "2026-07-07T09:00:00Z",
    finishedAt: "2026-07-07T09:04:00Z",
    createdAt: "2026-07-07T08:59:00Z",
    updatedAt: "2026-07-07T09:04:00Z",
  },
];

export const mockRejudgeBatchItems: RejudgeBatchItem[] = [
  { id: 1, batchId: 2, submissionId: 4, taskId: 2001, attemptId: 901, status: "completed", startedAt: "2026-07-07T10:00:10Z", finishedAt: "2026-07-07T10:00:14Z" },
  { id: 2, batchId: 2, submissionId: 5, taskId: 2002, attemptId: 902, status: "completed", startedAt: "2026-07-07T10:00:14Z", finishedAt: "2026-07-07T10:00:19Z" },
  { id: 3, batchId: 2, submissionId: 6, taskId: 2003, status: "failed", errorMessage: "judge agent disconnected before the attempt started", startedAt: "2026-07-07T10:00:19Z", finishedAt: "2026-07-07T10:00:21Z" },
  { id: 4, batchId: 2, submissionId: 7, taskId: 2004, status: "running", startedAt: "2026-07-07T10:00:21Z" },
  { id: 5, batchId: 2, submissionId: 8, taskId: 2005, status: "queued" },
];

export const mockAcmScoreboardRows = [  buildAcmScoreboardRow({ id: "team-1", handle: "lin-chen", solved: 5, penalty: 312, movement: 2 }),
  buildAcmScoreboardRow({ id: "team-2", handle: "mira", solved: 4, penalty: 260, movement: -1 }),
  buildAcmScoreboardRow({ id: "team-3", handle: "ravi", solved: 4, penalty: 344, movement: 0 }),
];

export const mockOiScoreboardRows = [
  buildOiScoreboardRow({ id: "team-1", handle: "lin-chen", score: 460, lastImprovedAt: "2026-07-07T10:35:00Z", movement: 2 }),
  buildOiScoreboardRow({ id: "team-2", handle: "mira", score: 420, lastImprovedAt: "2026-07-07T10:41:00Z", movement: 1 }),
  buildOiScoreboardRow({ id: "team-3", handle: "ravi", score: 420, lastImprovedAt: "2026-07-07T10:22:00Z", movement: -2 }),
];
