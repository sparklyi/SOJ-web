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
import { buildAcmScoreboardRow, buildContest, buildOiScoreboardRow, buildProblem, buildSubmission, hoursFromNow, minutesFromNow } from "./builders";

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

/**
 * 演示题目集。
 *
 * 统计量刻意做出真实的分化：简单题通过率六到七成，中等题三成上下，
 * 难题个位数到一成。旧夹具里每道题的 acceptedCount 都是 `184 + id`、
 * submissionCount 都是 `421 + 3 * id`，于是八道题的通过率全部落在 43.3% 附近——
 * 任何按这些数字画的图都会变成一组等长条，整页因此一眼就能看出是编的。
 */
export const mockProblems: ProblemDetail[] = [
  buildProblem({
    id: 1,
    title: "Shortest Path",
    difficulty: "easy",
    status: "accepted",
    tags: ["graphs"],
    acceptedCount: 1284,
    submissionCount: 2106,
  }),
  buildProblem({
    id: 2,
    title: "Cache Relay",
    difficulty: "medium",
    status: "attempted",
    tags: ["dp"],
    acceptedCount: 642,
    submissionCount: 1873,
  }),
  buildProblem({
    id: 3,
    title: "Frozen Matrix",
    difficulty: "hard",
    tags: ["matrix", "optimization"],
    acceptedCount: 87,
    submissionCount: 1902,
  }),
  buildProblem({
    id: 4,
    title: "Judge Queue",
    difficulty: "medium",
    tags: ["simulation"],
    acceptedCount: 411,
    submissionCount: 1204,
  }),
  buildProblem({
    id: 5,
    title: "Rank Delta",
    difficulty: "hard",
    tags: ["data-structures"],
    acceptedCount: 156,
    submissionCount: 1488,
  }),
  buildProblem({
    id: 6,
    title: "Binary Beacon",
    difficulty: "easy",
    tags: ["bitmask"],
    acceptedCount: 903,
    submissionCount: 1247,
  }),
  buildProblem({
    id: 7,
    title: "Memory Gate",
    difficulty: "medium",
    tags: ["greedy"],
    acceptedCount: 738,
    submissionCount: 2735,
  }),
  buildProblem({
    id: 8,
    title: "Arena Clock",
    difficulty: "hard",
    tags: ["math"],
    acceptedCount: 61,
    submissionCount: 988,
  }),
];

export const mockContests: ContestSummary[] = [
  buildContest({ id: 1, title: "SOJ Weekly Contest", type: "acm", status: "running" }),
  buildContest({
    id: 2,
    title: "OI Calibration Round",
    type: "oi",
    status: "frozen",
    registered: false,
    startsAt: hoursFromNow(-5),
    freezeAt: hoursFromNow(-2),
    endsAt: hoursFromNow(1),
  }),
];

/**
 * 提交记录。
 *
 * 每条都给一个**不同的** submittedAt：列表按时间倒序排，如果 8 条时间一样，
 * 排序会退化成按 id 兜底，读者看到的是「一列完全相同的时刻」——
 * 这是最省事、也最容易被识破的假数据形态。这里让提交节奏不均匀
 * （3 / 8 / 11 / 16 … 分钟），像真人断续投递，而不是机器批量生成。
 */
export const mockSubmissions: SubmissionSummary[] = [
  buildSubmission({ id: 1, status: "queued", score: 0, problemId: 8, problemTitle: "Arena Clock", submittedAt: minutesFromNow(-79) }),
  buildSubmission({ id: 2, status: "compiling", score: 0, problemId: 3, problemTitle: "Frozen Matrix", submittedAt: minutesFromNow(-66) }),
  buildSubmission({ id: 3, status: "running", score: 0, problemId: 5, problemTitle: "Rank Delta", submittedAt: minutesFromNow(-53) }),
  buildSubmission({
    id: 4,
    status: "accepted",
    score: 100,
    timeMs: 42,
    memoryKb: 8192,
    problemId: 1,
    problemTitle: "Shortest Path",
    submittedAt: minutesFromNow(-41),
  }),
  buildSubmission({
    id: 5,
    status: "wrong_answer",
    score: 35,
    timeMs: 39,
    memoryKb: 8192,
    problemId: 7,
    problemTitle: "Memory Gate",
    submittedAt: minutesFromNow(-27),
    result: {
      attemptId: 105,
      status: "wrong_answer",
      score: 35,
      firstFailedCaseIndex: 4,
      updatedAt: minutesFromNow(-26),
    },
    cases: Array.from({ length: 8 }, (_, index) => ({
      caseIndex: index + 1,
      status: (index < 3 ? "accepted" : index === 3 ? "wrong_answer" : "queued") as "accepted" | "wrong_answer" | "queued",
      score: index < 3 ? 10 : index === 3 ? 5 : 0,
    })),
    contestImpact: { penalty: "+20 min", rankMovement: "Pending" },
  }),
  buildSubmission({ id: 6, status: "runtime_error", score: 0, timeMs: 12, memoryKb: 4096, problemId: 3, problemTitle: "Frozen Matrix", submittedAt: minutesFromNow(-18) }),
  buildSubmission({ id: 7, status: "compile_error", score: 0, problemId: 6, problemTitle: "Binary Beacon", submittedAt: minutesFromNow(-11) }),
  buildSubmission({ id: 8, status: "system_error", score: 0, problemId: 5, problemTitle: "Rank Delta", submittedAt: minutesFromNow(-3) }),
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
