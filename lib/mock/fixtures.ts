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
import { buildAcmScoreboardRow, buildContest, buildProblem, buildSubmission, hoursFromNow, minutesFromNow } from "./builders";

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
  buildContest({ id: 1, title: "Sundial Weekly Contest", status: "running" }),
  buildContest({
    id: 2,
    title: "OI Calibration Round",
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
 * 三条约束：
 * ①每条都给一个**不同的** submittedAt，且**与 id 同向递增**（3 / 8 / 11 / 16 … 分钟）：
 *   提交号就是投递顺序，列表按时间倒序排 —— 如果时间不随 id 递增，
 *   读者会看到「#10 比 #1 还早」这种同一张表内自相矛盾的一列；
 *   全表共用同一个时刻更糟，排序会退化成按 id 兜底，呈现一列完全相同的 ":00"。
 * ②耗时与内存只在**真的跑过**的行上出现，而且互不相同——`queued` / `compiling`
 *   还没有跑，`compile_error` / `system_error` 根本没跑起来，空着就是空着
 *   （列表渲染成破折号）。给它们编一个数值比留空更假；
 * ③`running` 行给的是「到目前为止的峰值」，这是评测机本来就会报的量。
 */
export const mockSubmissions: SubmissionSummary[] = [
  buildSubmission({ id: 1, status: "queued", problemId: 8, problemTitle: "Arena Clock", submittedAt: minutesFromNow(-79) }),
  buildSubmission({ id: 2, status: "compiling", problemId: 3, problemTitle: "Frozen Matrix", submittedAt: minutesFromNow(-66) }),
  buildSubmission({
    id: 3,
    status: "running",
    timeMs: 118,
    memoryKb: 12288,
    problemId: 5,
    problemTitle: "Rank Delta",
    submittedAt: minutesFromNow(-53),
  }),
  buildSubmission({
    id: 4,
    status: "accepted",
    timeMs: 42,
    memoryKb: 8192,
    problemId: 1,
    problemTitle: "Shortest Path",
    submittedAt: minutesFromNow(-41),
  }),
  buildSubmission({
    id: 5,
    status: "wrong_answer",
    timeMs: 39,
    memoryKb: 6400,
    problemId: 7,
    problemTitle: "Memory Gate",
    submittedAt: minutesFromNow(-27),
    result: {
      attemptId: 105,
      status: "wrong_answer",
      firstFailedCaseIndex: 4,
      updatedAt: minutesFromNow(-26),
    },
    cases: Array.from({ length: 8 }, (_, index) => ({
      caseIndex: index + 1,
      status: (index < 3 ? "accepted" : index === 3 ? "wrong_answer" : "queued") as "accepted" | "wrong_answer" | "queued",
    })),
    contestImpact: { penalty: "+20 min", rankMovement: "Pending" },
  }),
  buildSubmission({ id: 6, status: "runtime_error", timeMs: 12, memoryKb: 4096, problemId: 3, problemTitle: "Frozen Matrix", submittedAt: minutesFromNow(-18) }),
  buildSubmission({ id: 7, status: "compile_error", problemId: 6, problemTitle: "Binary Beacon", submittedAt: minutesFromNow(-11) }),
  buildSubmission({ id: 8, status: "system_error", problemId: 5, problemTitle: "Rank Delta", submittedAt: minutesFromNow(-3) }),
  buildSubmission({
    id: 9,
    status: "time_limit",
    timeMs: 1000,
    memoryKb: 262144,
    problemId: 4,
    problemTitle: "Judge Queue",
    submittedAt: minutesFromNow(-2),
  }),
  buildSubmission({
    id: 10,
    status: "accepted",
    timeMs: 27,
    memoryKb: 5632,
    problemId: 8,
    problemTitle: "Arena Clock",
    submittedAt: minutesFromNow(-1),
  }),
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
  {
    id: 50,
    engine: "soj-agent",
    engineLanguageId: "c",
    name: "C",
    version: "C17",
    compileCommand: "gcc -std=c17 -O2 -pipe -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 1000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
  {
    id: 62,
    engine: "soj-agent",
    engineLanguageId: "java",
    name: "Java",
    version: "21",
    compileCommand: "javac -encoding UTF-8 -d . {{source}}",
    runCommand: "java -XX:+UseSerialGC -Xss64m -cp . Main",
    defaultTimeLimitMs: 3000,
    defaultMemoryLimitKb: 524288,
    enabled: true,
  },
  {
    id: 63,
    engine: "soj-agent",
    engineLanguageId: "nodejs",
    name: "JavaScript (Node.js)",
    version: "22",
    compileCommand: "node --check {{source}}",
    runCommand: "node {{source}}",
    defaultTimeLimitMs: 2000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
  {
    id: 71,
    engine: "soj-agent",
    engineLanguageId: "python3",
    name: "Python 3",
    version: "3.12",
    compileCommand: "python3 -m py_compile {{source}}",
    runCommand: "python3 {{source}}",
    defaultTimeLimitMs: 2000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
  {
    id: 73,
    engine: "soj-agent",
    engineLanguageId: "rust",
    name: "Rust",
    version: "1.83",
    compileCommand: "rustc --edition 2021 -O -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 2000,
    defaultMemoryLimitKb: 524288,
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
  // 失败原因是上游评测机回报的**系统消息**，按原样显示、不进 i18n；
  // 但它必须是给人看的句子，不是从日志里抠出来的一截小写内部描述。
  { id: 3, batchId: 2, submissionId: 6, taskId: 2003, status: "failed", errorMessage: "Judge worker disconnected before the attempt started.", startedAt: "2026-07-07T10:00:19Z", finishedAt: "2026-07-07T10:00:21Z" },
  { id: 4, batchId: 2, submissionId: 7, taskId: 2004, status: "running", startedAt: "2026-07-07T10:00:21Z" },
  { id: 5, batchId: 2, submissionId: 8, taskId: 2005, status: "queued" },
];

/**
 * 排行榜。
 *
 * 三支队伍的每一格必须**彼此不同**——旧数据里三个人在 B 题上全是
 * 「答案错误 2」，同一列三个一模一样的单元格比空着更假。
 * `solved` / `penalty` 与各自单元格自洽：比赛只有 A/B/C 三道题，
 * 通过题数不可能出现 4、5。
 */
export const mockAcmScoreboardRows = [
  buildAcmScoreboardRow({
    id: "team-1",
    handle: "lin-chen",
    solved: 3,
    penalty: 214,
    movement: 2,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", attempts: 1, penalty: 42 },
      { problemId: 2, alias: "B", status: "accepted", attempts: 1, penalty: 58 },
      { problemId: 3, alias: "C", status: "accepted", attempts: 2, penalty: 94 },
    ],
  }),
  buildAcmScoreboardRow({
    id: "team-2",
    handle: "mira",
    solved: 2,
    penalty: 176,
    movement: -1,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", attempts: 2, penalty: 67 },
      { problemId: 2, alias: "B", status: "wrong_answer", attempts: 3 },
      { problemId: 3, alias: "C", status: "accepted", attempts: 1, penalty: 89 },
    ],
  }),
  buildAcmScoreboardRow({
    id: "team-3",
    handle: "ravi",
    solved: 1,
    penalty: 55,
    movement: 0,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", attempts: 1, penalty: 55 },
      { problemId: 2, alias: "B", status: "pending", attempts: 1 },
      { problemId: 3, alias: "C", status: "none" },
    ],
  }),
];

