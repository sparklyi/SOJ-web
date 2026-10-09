import { ApiError, notFound } from "./errors";
import { matchesProblemFilter, normalizeProblemFilter } from "@/lib/domain/problem";
import { createMockSession } from "@/lib/auth/session";
import { buildAcmScoreboard } from "@/lib/domain/scoreboard";
import {
  mockAcmScoreboardRows,
  mockAdminContests,
  mockAdminUsers,
  mockAuditEvents,
  mockContests,
  mockContestRoleAssignments,
  mockLanguages,
  mockProblems,
  mockProblemsAwaitingReview,
  mockRejudgeBatchItems,
  mockRejudgeBatches,
  mockReviewEvents,
  mockSubmissions,
  mockUser,
} from "@/lib/mock/fixtures";
import { roles, type ContestRole, type GlobalRole, type Permission, type Role } from "@/lib/auth/permissions";
import { lockedRoles, permissionCatalog, permissionsForRole, roleScope } from "@/lib/mock/role-permissions";
import { deriveAuthoringFlow } from "@/features/problems/authoring/flow";
import type {
  AdminContest,
  AdminContestFilter,
  AdminContestInput,
  AdminLanguageUpdateInput,
  AdminProblemFilter,
  AdminUser,
  ApiClient,
  AuditAction,
  AuditEvent,
  AuditEventFilter,
  AuditObjectType,
  AuthoringProblem,
  AuthoringStatement,
  AuthoringTestcaseSet,
  ContestRoleAssignment,
  ContestSummary,
  CurrentUser,
  GlobalRoleAssignment,
  JudgeLanguage,
  ProblemCheckRun,
  ProblemReviewEvent,
  RejudgeBatch,
  RejudgeBatchItem,
  RunSummary,
  SubmissionSummary,
  RolePermissionEntry,
  RolePermissionMatrix,
} from "./types";

type MockAdapterOptions = {
  currentUser?: CurrentUser | null;
};

const createdSubmissions: SubmissionSummary[] = [];
// Source lives with the submission in the mock so the detail page's source view
// has something real to show, mirroring the backend's artifact store.
const createdSubmissionSources = new Map<number, string>();
const createdRuns: RunSummary[] = [];
let nextSubmissionId = 10_000;
let nextRunId = 20_000;
let nextProblemId = 30_000;
let nextTestcaseSetId = 40_000;
let nextCheckId = 50_000;
let nextReviewEventId = 60_000;
let nextContestRoleId = 70_000;
let nextRejudgeBatchId = 80_000;
let nextRoleAssignmentId = 90_000;
let nextAuditEventId = 100_000;
let nextContestId = 110_000;

const authoredProblems: AuthoringProblem[] = mockProblems.slice(0, 3).map((problem) => ({
  id: problem.id,
  title: problem.title,
  slug: problem.slug,
  difficulty: problem.difficulty,
  visibility: "public",
  publicationStatus: mockProblemsAwaitingReview.includes(problem.title) ? "in_review" : "published",
  tags: problem.tags,
  timeLimitMs: problem.timeLimitMs,
  memoryLimitKb: problem.memoryLimitKb,
  ownerUserId: mockUser.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const authoringStatements = new Map<number, AuthoringStatement>();
const authoringTestcaseSets = new Map<number, AuthoringTestcaseSet>();
const authoringChecks = new Map<number, ProblemCheckRun>();
const reviewEvents = new Map<number, ProblemReviewEvent[]>();
const contestRoleAssignments: ContestRoleAssignment[] = [...mockContestRoleAssignments];
const adminUsers: AdminUser[] = mockAdminUsers.map((user) => ({ ...user, roles: [...user.roles] }));
const adminContests: AdminContest[] = mockAdminContests.map((contest) => ({ ...contest, problems: [...contest.problems] }));
const judgeLanguages: JudgeLanguage[] = mockLanguages.map((language) => ({ ...language }));
const auditEvents: AuditEvent[] = mockAuditEvents.map((event) => ({ ...event }));

/**
 * Phase-2 role→permission state. `admin`/`root` are locked and always report
 * the whole directory; every other role starts from the seeded defaults in
 * `lib/mock/role-permissions.ts` and is replaced wholesale by an update.
 */
const rolePermissionState = new Map<Role, Permission[]>();
for (const role of roles) {
  rolePermissionState.set(role, permissionsForRole(role));
}

// The admin problem list spans every seeded problem, not just the authoring
// console's three. The first entries stay shared with `authoredProblems` so an
// archive here is visible in the authoring console too.
const adminProblems: AuthoringProblem[] = [
  ...authoredProblems,
  ...mockProblems.slice(authoredProblems.length).map((problem, index) => ({
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    visibility: index % 4 === 0 ? ("private" as const) : ("public" as const),
    publicationStatus: (index % 4 === 1 ? "draft" : index % 4 === 2 ? "archived" : "published") as AuthoringProblem["publicationStatus"],
    tags: problem.tags,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
    ownerUserId: mockAdminUsers[(index + 1) % mockAdminUsers.length].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
];
const rejudgeBatches: RejudgeBatch[] = mockRejudgeBatches.map((batch) => ({ ...batch }));
const rejudgeBatchItems = new Map<number, RejudgeBatchItem[]>();

for (const event of mockReviewEvents) {
  reviewEvents.set(event.problemId, [...(reviewEvents.get(event.problemId) ?? []), event]);
}

for (const item of mockRejudgeBatchItems) {
  rejudgeBatchItems.set(item.batchId, [...(rejudgeBatchItems.get(item.batchId) ?? []), item]);
}

for (const problem of authoredProblems) {
  const statement: AuthoringStatement = {
    problemId: problem.id,
    version: 1,
    title: problem.title,
    description: `Solve ${problem.title}.`,
    inputDescription: "Input data.",
    outputDescription: "Expected output.",
    samples: [{ input: "1", output: "1" }],
    hint: "",
    source: "Sundial",
  };
  const testcaseSet: AuthoringTestcaseSet = {
    id: nextTestcaseSetId++,
    problemId: problem.id,
    version: 1,
    checksumSha256: "mock-checksum",
    sizeBytes: 1024,
    caseCount: 1,
    isCurrent: true,
    createdAt: new Date().toISOString(),
  };
  const check: ProblemCheckRun = {
    id: nextCheckId++,
    problemId: problem.id,
    testcaseSetId: testcaseSet.id,
    status: "completed",
    summary: { caseCount: 1, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
    findings: [],
    createdAt: new Date().toISOString(),
  };
  authoringStatements.set(problem.id, statement);
  authoringTestcaseSets.set(problem.id, testcaseSet);
  authoringChecks.set(problem.id, check);
}

function mockAuthUser(input: { email: string; username?: string }): CurrentUser {
  const handle = input.username ?? input.email.split("@")[0] ?? mockUser.handle;
  return {
    ...mockUser,
    handle,
    displayName: handle,
  };
}

function recordReviewEvent(
  problemId: number,
  fromStatus: AuthoringProblem["publicationStatus"],
  toStatus: AuthoringProblem["publicationStatus"],
  decision: ProblemReviewEvent["decision"],
  actorUserId: number,
  comment?: string,
) {
  const event: ProblemReviewEvent = {
    id: nextReviewEventId++,
    problemId,
    actorUserId,
    fromStatus,
    toStatus,
    decision,
    createdAt: new Date().toISOString(),
  };
  if (comment) event.comment = comment;
  reviewEvents.set(problemId, [event, ...(reviewEvents.get(problemId) ?? [])]);
}

export function createMockAdapter(options: MockAdapterOptions = {}): ApiClient {
  const currentUser = options.currentUser ?? null;

  return {
    auth: {
      login: async (input) => createMockSession(mockAuthUser(input)),
      register: async (input) => createMockSession(mockAuthUser(input)),
      refresh: async () => createMockSession(requireMockUser(currentUser)),
      logout: async () => undefined,
      me: async () => currentUser,
    },
    problems: {
      // 站点策略与后端 SOJ 一致：publish 的公开题对匿名可读；私有/草稿只有作者与管理员可见（由 mock 数据本身表达）。
      list: async (input) => {
        const filter = normalizeProblemFilter(input);
        return paginate(mockProblems.filter((problem) => matchesProblemFilter(problem, filter)), filter.page, filter.pageSize);
      },
      get: async (id) => {
        const problem = mockProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        return problem;
      },
      listMine: async (input) => {
        const actor = requireAuthoringAccess(currentUser);
        const items = authoredProblems.filter((problem) => problem.ownerUserId === actor.id);
        const filter = normalizeProblemFilter(input);
        return paginate(items, filter.page, filter.pageSize);
      },
      create: async (input) => {
        const actor = requireProblemAuthorAccess(currentUser);
        const problem: AuthoringProblem = {
          id: nextProblemId++,
          title: input.title,
          // 服务端生成 slug：标题不可 slug 化时回落 problem，再拼 6 位随机 hex。
          slug: `${slugify(input.title) || "problem"}-${randomHex(6)}`,
          difficulty: input.difficulty ?? "medium",
          visibility: input.visibility ?? "private",
          publicationStatus: "draft",
          tags: input.tags ?? [],
          timeLimitMs: input.timeLimitMs ?? 1000,
          memoryLimitKb: input.memoryLimitKb ?? 262144,
          ownerUserId: actor.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        authoredProblems.unshift(problem);
        return problem;
      },
      update: async (id, input) => {
        requireProblemAuthorAccess(currentUser);
        const index = authoredProblems.findIndex((problem) => problem.id === id);
        if (index < 0) throw notFound("Problem", id);
        authoredProblems[index] = { ...authoredProblems[index], ...input };
        return authoredProblems[index];
      },
      saveStatement: async (id, input) => {
        requireProblemAuthorAccess(currentUser);
        const problem = authoredProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        const statement: AuthoringStatement = {
          ...input,
          problemId: id,
          // 标题写 problem.title 的当前值，题面请求里已经没有 title。
          title: problem.title,
          version: (authoringStatements.get(id)?.version ?? 0) + 1,
        };
        authoringStatements.set(id, statement);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return statement;
      },
      uploadTestcases: async (id, input) => {
        requireProblemAuthorAccess(currentUser);
        // mock 只按文件名模拟解析结果：坏包（文件名含 invalid）回 findings，
        // 合法包固定 2 用例且无 warnings。真实解析由后端负责。
        if (input.archive.name.toLowerCase().includes("invalid")) {
          throw new ApiError("testcase archive is invalid", "testcase.archive_invalid", 422, {
            findings: [{ severity: "error", code: "testcase.output_missing", file: "3.in", message: "3.in has no matching 3.ans" }],
          });
        }
        const testcaseSet: AuthoringTestcaseSet = {
          id: nextTestcaseSetId++,
          problemId: id,
          version: (authoringTestcaseSets.get(id)?.version ?? 0) + 1,
          checksumSha256: "mock-checksum",
          sizeBytes: input.archive.size,
          caseCount: 2,
          isCurrent: true,
          createdAt: new Date().toISOString(),
        };
        authoringTestcaseSets.set(id, testcaseSet);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return { ...testcaseSet, warnings: [] };
      },
      getAuthoringState: async (id) => {
        requireAuthoringAccess(currentUser);
        const problem = authoredProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        const statement = authoringStatements.get(id);
        const testcaseSet = authoringTestcaseSets.get(id);
        const latestCheck = authoringChecks.get(id);
        // 文案与顺序复刻后端 problem_readiness 的 blockers，界面直接渲染这些 message。
        const blockers = [
          ...(!statement ? [{ code: "problem.statement_required", message: "current statement is required before publishing", step: "statement" as const }] : []),
          ...(!testcaseSet ? [{ code: "problem.testcase_required", message: "current testcase set is required before publishing", step: "testcase" as const }] : []),
          ...(testcaseSet && !latestCheck ? [{ code: "problem.check_required", message: "run a problem check for the current testcase set before publishing", step: "check" as const }] : []),
          ...(latestCheck && !latestCheck.summary.valid
            ? [{ code: "problem.check_failed", message: "the current testcase set has validation errors", step: "check" as const }]
            : []),
        ];
        const publishable = blockers.length === 0 && Boolean(latestCheck?.summary.valid);
        return { problem, statement, testcaseSet, latestCheck, flow: deriveAuthoringFlow({ problem, statement, testcaseSet, latestCheck }), publishable, blockers };
      },
      runCheck: async (id) => {
        requireProblemAuthorAccess(currentUser);
        const testcaseSet = authoringTestcaseSets.get(id);
        if (!testcaseSet) throw notFound("Testcase set", id);
        const check: ProblemCheckRun = {
          id: nextCheckId++,
          problemId: id,
          testcaseSetId: testcaseSet.id,
          status: "completed",
          summary: { caseCount: testcaseSet.caseCount, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
          findings: [],
          createdAt: new Date().toISOString(),
        };
        authoringChecks.set(id, check);
        return check;
      },
      submitReview: async (id) => {
        const actor = requireAuthoringAccess(currentUser);
        const state = await createMockAdapter(options).problems.getAuthoringState(id);
        if (!state.publishable) throw new Error(state.blockers[0]?.message ?? "Problem is not ready for review.");
        const index = authoredProblems.findIndex((problem) => problem.id === id);
        if (index < 0) throw notFound("Problem", id);
        if (authoredProblems[index].publicationStatus !== "draft" && authoredProblems[index].publicationStatus !== "changes_requested") {
          throw new ApiError("Problem cannot be submitted for review in its current state.", "problem.review_invalid_state", 409);
        }
        const fromStatus = authoredProblems[index].publicationStatus;
        authoredProblems[index] = { ...authoredProblems[index], publicationStatus: "in_review" };
        recordReviewEvent(id, fromStatus, "in_review", "submit", actor.id);
        return authoredProblems[index];
      },
      reviewQueue: async () => {
        requireAnyPermission(currentUser, ["problem.review", "problem.manage_all"]);
        const items = authoredProblems.filter((problem) => problem.publicationStatus === "in_review");
        return { items, total: items.length };
      },
      decideReview: async (id, input) => {
        const actor = requirePermission(currentUser, "problem.review");
        if (!actor.permissions.includes("problem.publish")) {
          throw new ApiError("Problem publish permission is required.", "auth.forbidden", 403);
        }
        const index = authoredProblems.findIndex((problem) => problem.id === id);
        if (index < 0) throw notFound("Problem", id);
        if (authoredProblems[index].ownerUserId === actor.id) {
          throw new ApiError("Authors cannot review their own problems.", "problem.self_review_forbidden", 403);
        }
        if (authoredProblems[index].publicationStatus !== "in_review") {
          throw new ApiError("Problem is not awaiting review.", "problem.review_invalid_state", 409);
        }
        const toStatus = input.decision === "approve" ? "published" : "changes_requested";
        authoredProblems[index] = { ...authoredProblems[index], publicationStatus: toStatus };
        recordReviewEvent(id, "in_review", toStatus, input.decision, actor.id, input.comment);
        return authoredProblems[index];
      },
      reviewEvents: async (id) => {
        requireAuthoringAccess(currentUser);
        return [...(reviewEvents.get(id) ?? [])];
      },
    },
    submissions: {
      list: async () => {
        const items = [...createdSubmissions, ...mockSubmissions];
        return { items, total: items.length };
      },
      get: async (id) => {
        const submission = [...createdSubmissions, ...mockSubmissions].find((item) => item.id === id);
        if (!submission) throw notFound("Submission", id);
        return submission;
      },
      source: async (id) => {
        const submission = [...createdSubmissions, ...mockSubmissions].find((item) => item.id === id);
        if (!submission) throw notFound("Submission", id);
        return {
          sourceCode: createdSubmissionSources.get(id) ?? "// mock submission source\n",
          languageId: 54,
        };
      },
      create: async (input) => {
        const problem = mockProblems.find((item) => item.id === input.problemId);
        const now = new Date().toISOString();
        const id = nextSubmissionId++;
        // 演示夹具直接落终态（与 mock 的 run 同一策略）：否则任何轮询的界面都会
        // 一路等到截止时间，mock 模式下提交就是一个永远转圈的页面。
        const submission: SubmissionSummary = {
          id,
          problemId: input.problemId,
          problemTitle: problem?.title ?? `Problem #${input.problemId}`,
          contestId: input.contestId,
          status: "accepted",
          timeMs: 42,
          memoryKb: 8192,
          submittedAt: now,
          result: { attemptId: id + 1000, status: "accepted", timeMs: 42, memoryKb: 8192, updatedAt: now },
          cases: Array.from({ length: 4 }, (_, index) => ({
            caseIndex: index + 1,
            status: "accepted" as const,
            timeMs: 8,
            memoryKb: 4096,
          })),
        };
        createdSubmissions.unshift(submission);
        createdSubmissionSources.set(submission.id, input.sourceCode);
        return submission;
      },
    },
    runs: {
      // 演示夹具直接回一个终态结果。
      //
      // 以前这里返回 `queued` 且 get 永远回同一个 queued，于是任何轮询运行
      // 的界面都会一路等到截止时间——练习场在 mock 模式下就是一个永远转圈
      // 的页面。那不是「后端没接」，是夹具坏了。
      //
      // 也没有 requireMockUser：mock 模式是给评审和后端未就绪时开发用的，
      // 练习场被登录墙挡住的话，评审根本看不到这个模块长什么样。
      // 这是**故意**比 http 模式宽松，不是漏判。
      create: async (input) => {
        const now = new Date().toISOString();
        const run: RunSummary = {
          id: nextRunId++,
          problemId: input.problemId,
          languageId: input.languageId,
          status: "accepted",
          stdout: mockRunStdout(input.stdin),
          stderr: "",
          compileOutput: undefined,
          errorMessage: undefined,
          timeMs: 12,
          memoryKb: 3_400,
          createdAt: now,
          finishedAt: now,
        };
        createdRuns.unshift(run);
        return run;
      },
      get: async (id) => {
        const run = createdRuns.find((item) => item.id === id);
        if (!run) throw notFound("Run", id);
        return run;
      },
    },
    contests: {
      // 站点策略与后端 SOJ 一致：比赛内容（列表、详情）只对已登录 actor 开放。
      list: async () => {
        requireMockUser(currentUser);
        const items = mockContests.map((contest) => withScopedRoles(contest, currentUser));
        return { items, total: items.length };
      },
      get: async (id) => {
        requireMockUser(currentUser);
        const contest = mockContests.find((item) => item.id === id);
        if (!contest) throw notFound("Contest", id);
        return withScopedRoles(contest, currentUser);
      },
      register: async (id, input) => ({
        id,
        contestId: id,
        userId: requireMockUser(currentUser).id,
        displayName: input.displayName,
        email: input.email,
        status: "active",
        registeredAt: new Date().toISOString(),
      }),
      scoreboard: async (id) => {
        const contest = mockContests.find((item) => item.id === id);
        if (!contest) throw notFound("Contest", id);

        return buildAcmScoreboard(mockAcmScoreboardRows);
      },
      listRoles: async (id) => {
        requireContestRoleManager(currentUser, id);
        return contestRoleAssignments.filter((assignment) => assignment.contestId === id);
      },
      grantRole: async (id, input) => {
        const actor = requireContestRoleManager(currentUser, id);
        if (actor.id === input.userId) {
          throw new ApiError("You cannot grant a contest role to yourself.", "contest.role_self_grant_forbidden", 403);
        }
        const existing = contestRoleAssignments.find(
          (assignment) => assignment.contestId === id && assignment.userId === input.userId && assignment.role === input.role,
        );
        if (existing) {
          throw new ApiError("Contest role is already assigned.", "contest.role_exists", 409);
        }
        const assignment: ContestRoleAssignment = {
          id: nextContestRoleId++,
          contestId: id,
          userId: input.userId,
          username: userHandle(input.userId),
          role: input.role,
          grantedBy: actor.id,
          grantedAt: new Date().toISOString(),
        };
        contestRoleAssignments.push(assignment);
        return assignment;
      },
      revokeRole: async (id, input) => {
        requireContestRoleManager(currentUser, id);
        const index = contestRoleAssignments.findIndex(
          (assignment) => assignment.contestId === id && assignment.userId === input.userId && assignment.role === input.role,
        );
        if (index < 0) throw notFound("Contest role assignment", input.userId);
        contestRoleAssignments.splice(index, 1);
      },
    },
    languages: {
      list: async (filter = {}) => {
        const items = judgeLanguages.filter((language) => {
          if (typeof filter.enabled === "boolean" && language.enabled !== filter.enabled) return false;
          if (filter.engine && language.engine !== filter.engine) return false;
          return true;
        });
        return { items, total: items.length };
      },
    },
    stats: {
      // 演示夹具没有 Redis 可言，但口径与真实接口一致：
      // 题目数 = 展示的公开题，提交数 = 各题提交量之和，语言数 = 已启用语言。
      site: async () => ({
        problems: mockProblems.length,
        submissions: mockProblems.reduce((total, problem) => total + problem.submissionCount, 0),
        languages: judgeLanguages.filter((language) => language.enabled).length,
      }),
    },
    rejudge: {
      list: async (filter = {}) => {
        const actor = requireMockUser(currentUser);
        const items = rejudgeBatches.filter((batch) => {
          if (!actor.permissions.includes("problem.manage_all") && batch.requestedBy !== actor.id) return false;
          if (filter.problemId != null && batch.problemId !== filter.problemId) return false;
          if (filter.contestId != null && batch.contestId !== filter.contestId) return false;
          if (filter.status && batch.status !== filter.status) return false;
          return true;
        });
        return { items, total: items.length };
      },
      create: async (input) => {
        const actor = authorizeRejudge(currentUser, input.problemId, input.contestId);
        if (!input.reason.trim()) {
          throw new ApiError("Rejudge reason is required.", "rejudge.reason_required", 400);
        }
        const timestamp = new Date().toISOString();
        const batch: RejudgeBatch = {
          id: nextRejudgeBatchId++,
          requestedBy: actor.id,
          status: "queued",
          reason: input.reason,
          totalCount: 0,
          completedCount: 0,
          failedCount: 0,
          canceledCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        if (input.problemId != null) batch.problemId = input.problemId;
        if (input.contestId != null) batch.contestId = input.contestId;
        rejudgeBatches.unshift(batch);
        rejudgeBatchItems.set(batch.id, []);
        return batch;
      },
      get: async (id) => {
        requireMockUser(currentUser);
        const batch = rejudgeBatches.find((item) => item.id === id);
        if (!batch) throw notFound("Rejudge batch", id);
        authorizeRejudge(currentUser, batch.problemId, batch.contestId);
        return { batch, items: [...(rejudgeBatchItems.get(id) ?? [])] };
      },
      cancel: async (id, input) => {
        requireMockUser(currentUser);
        const index = rejudgeBatches.findIndex((batch) => batch.id === id);
        if (index < 0) throw notFound("Rejudge batch", id);
        authorizeRejudge(currentUser, rejudgeBatches[index].problemId, rejudgeBatches[index].contestId);
        if (!input.reason.trim()) {
          throw new ApiError("Cancellation reason is required.", "rejudge.cancel_reason_required", 400);
        }
        if (rejudgeBatches[index].status !== "queued" && rejudgeBatches[index].status !== "running") {
          throw new ApiError("Only queued or running batches can be canceled.", "rejudge.not_cancelable", 409);
        }
        const items = rejudgeBatchItems.get(id) ?? [];
        const canceledCount = items.filter((item) => item.status === "queued").length;
        rejudgeBatchItems.set(
          id,
          items.map((item) => (item.status === "queued" ? { ...item, status: "canceled" as const } : item)),
        );
        rejudgeBatches[index] = {
          ...rejudgeBatches[index],
          status: "canceled",
          canceledCount: rejudgeBatches[index].canceledCount + canceledCount,
          updatedAt: new Date().toISOString(),
        };
        return rejudgeBatches[index];
      },
    },
    admin: {
      listUsers: async (filter = {}) => {
        requirePermission(currentUser, "user.manage");
        let items = adminUsers.map((user) => ({ ...user, roles: [...user.roles] }));
        if (filter.keyword) {
          const keyword = filter.keyword.toLowerCase();
          items = items.filter((user) => user.handle.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword));
        }
        if (filter.status) {
          items = items.filter((user) => user.status === filter.status);
        }
        return paginate(items, filter.page, filter.pageSize);
      },
      updateUser: async (id, input) => {
        const actor = requirePermission(currentUser, "user.manage");
        const index = adminUsers.findIndex((user) => user.id === id);
        if (index < 0) throw notFound("User", id);
        const previousStatus = adminUsers[index].status;
        const next: AdminUser = { ...adminUsers[index], roles: [...adminUsers[index].roles], updatedAt: new Date().toISOString() };
        if (input.username !== undefined) next.handle = input.username;
        if (input.status !== undefined) next.status = input.status;
        adminUsers[index] = next;
        if (input.status !== undefined && input.status !== previousStatus) {
          recordAudit(actor.id, userStatusAction(input.status), "user", id);
        }
        return next;
      },
      grantRole: async (id, input) => {
        const actor = requirePermission(currentUser, "role.grant");
        if (actor.id === id) {
          throw new ApiError("Role target is invalid.", "role.invalid_target", 400);
        }
        const index = adminUsers.findIndex((user) => user.id === id);
        if (index < 0) throw notFound("User", id);
        if (adminUsers[index].roles.includes(input.role)) {
          throw new ApiError("Role is already assigned.", "role.exists", 409);
        }
        adminUsers[index] = { ...adminUsers[index], roles: [...adminUsers[index].roles, input.role as GlobalRole] };
        const assignment: GlobalRoleAssignment = {
          id: nextRoleAssignmentId++,
          userId: id,
          role: input.role,
          grantedBy: actor.id,
          grantedAt: new Date().toISOString(),
        };
        recordAudit(actor.id, "user.role.granted", "user", id, input.reason, { role: input.role });
        return assignment;
      },
      revokeRole: async (id, input) => {
        const actor = requirePermission(currentUser, "role.revoke");
        const index = adminUsers.findIndex((user) => user.id === id);
        if (index < 0) throw notFound("User", id);
        const roles = adminUsers[index].roles.filter((role) => role !== input.role);
        if (roles.length === adminUsers[index].roles.length) throw notFound("Role assignment", id);
        adminUsers[index] = { ...adminUsers[index], roles };
        recordAudit(actor.id, "user.role.revoked", "user", id, input.reason, { role: input.role });
      },
      languages: {
        list: async (filter = {}) => {
          requirePermission(currentUser, "system.manage");
          const items = judgeLanguages.filter((language) => {
            if (typeof filter.enabled === "boolean" && language.enabled !== filter.enabled) return false;
            if (filter.engine && language.engine !== filter.engine) return false;
            return true;
          });
          return paginate(items.map((language) => ({ ...language })), filter.page, filter.pageSize);
        },
        update: async (id: number, input: AdminLanguageUpdateInput) => {
          const actor = requirePermission(currentUser, "system.manage");
          const index = judgeLanguages.findIndex((language) => language.id === id);
          if (index < 0) throw notFound("Language", id);
          const previousEnabled = judgeLanguages[index].enabled;
          if (input.enabled !== undefined) judgeLanguages[index].enabled = input.enabled;
          if (input.defaultTimeLimitMs !== undefined) judgeLanguages[index].defaultTimeLimitMs = input.defaultTimeLimitMs;
          if (input.defaultMemoryLimitKb !== undefined) judgeLanguages[index].defaultMemoryLimitKb = input.defaultMemoryLimitKb;
          if (input.enabled !== undefined && input.enabled !== previousEnabled) {
            recordAudit(actor.id, input.enabled ? "language.enabled" : "language.disabled", "language", id);
          }
          return { ...judgeLanguages[index] };
        },
      },
      problems: {
        list: async (filter: AdminProblemFilter = {}) => {
          requirePermission(currentUser, "problem.manage_all");
          let items = adminProblems.map((problem) => ({ ...problem, tags: [...problem.tags] }));
          if (filter.keyword) {
            const keyword = filter.keyword.toLowerCase();
            items = items.filter((problem) => problem.title.toLowerCase().includes(keyword) || problem.slug.toLowerCase().includes(keyword));
          }
          if (filter.status) items = items.filter((problem) => problem.publicationStatus === filter.status);
          if (filter.visibility) items = items.filter((problem) => problem.visibility === filter.visibility);
          if (filter.tag) items = items.filter((problem) => problem.tags.includes(filter.tag!));
          if (filter.owner) {
            const owner = filter.owner.toLowerCase();
            items = items.filter((problem) => userHandle(problem.ownerUserId)?.toLowerCase().includes(owner));
          }
          return paginate(items, filter.page, filter.pageSize);
        },
        archive: async (id: number) => {
          const actor = requirePermission(currentUser, "problem.manage_all");
          const index = adminProblems.findIndex((problem) => problem.id === id);
          if (index < 0) throw notFound("Problem", id);
          const previous = adminProblems[index].publicationStatus;
          if (previous === "archived") return;
          archivedFromStatus.set(id, previous);
          Object.assign(adminProblems[index], { publicationStatus: "archived", updatedAt: new Date().toISOString() });
          recordAudit(actor.id, "problem.archived", "problem", id, undefined, { previous_status: previous });
        },
        restore: async (id: number) => {
          const actor = requirePermission(currentUser, "problem.manage_all");
          const index = adminProblems.findIndex((problem) => problem.id === id);
          if (index < 0) throw notFound("Problem", id);
          if (adminProblems[index].publicationStatus !== "archived") {
            throw new ApiError("Problem is not archived.", "problem.not_archived", 409);
          }
          Object.assign(adminProblems[index], {
            publicationStatus: archivedFromStatus.get(id) ?? "draft",
            updatedAt: new Date().toISOString(),
          });
          recordAudit(actor.id, "problem.restored", "problem", id);
          return { ...adminProblems[index], tags: [...adminProblems[index].tags] };
        },
      },
      contests: {
        list: async (filter: AdminContestFilter = {}) => {
          requirePermission(currentUser, "contest.manage_all");
          let items = adminContests.map((contest) => ({ ...contest, problems: [...contest.problems] }));
          if (filter.keyword) {
            const keyword = filter.keyword.toLowerCase();
            items = items.filter((contest) => contest.title.toLowerCase().includes(keyword));
          }
          if (filter.status) items = items.filter((contest) => contest.status === filter.status);
          return paginate(items, filter.page, filter.pageSize);
        },
        create: async (input: AdminContestInput) => {
          const actor = requirePermission(currentUser, "contest.manage_all");
          const now = new Date().toISOString();
          const contest: AdminContest = {
            id: nextContestId++,
            ownerUserId: actor.id,
            title: input.title,
            status: input.status,
            visibility: input.visibility,
            startsAt: input.startAt,
            endsAt: input.endAt,
            freezeAt: input.freezeAt,
            problems: (input.problems ?? []).map((problem) => ({ problemId: problem.problemId, alias: problem.alias, title: `Problem ${problem.alias}` })),
            createdAt: now,
            updatedAt: now,
          };
          adminContests.push(contest);
          return { ...contest, problems: [...contest.problems] };
        },
        update: async (id: number, input: AdminContestInput) => {
          requirePermission(currentUser, "contest.manage_all");
          const index = adminContests.findIndex((contest) => contest.id === id);
          if (index < 0) throw notFound("Contest", id);
          Object.assign(adminContests[index], {
            title: input.title,
            status: input.status,
            visibility: input.visibility,
            startsAt: input.startAt,
            endsAt: input.endAt,
            freezeAt: input.freezeAt,
            problems: (input.problems ?? []).map((problem) => ({ problemId: problem.problemId, alias: problem.alias, title: `Problem ${problem.alias}` })),
            updatedAt: new Date().toISOString(),
          });
          return { ...adminContests[index], problems: [...adminContests[index].problems] };
        },
        archive: async (id: number) => {
          const actor = requirePermission(currentUser, "contest.manage_all");
          const index = adminContests.findIndex((contest) => contest.id === id);
          if (index < 0) throw notFound("Contest", id);
          if (adminContests[index].status === "archived") return;
          Object.assign(adminContests[index], { status: "archived", updatedAt: new Date().toISOString() });
          recordAudit(actor.id, "contest.archived", "contest", id);
        },
      },
      audit: {
        list: async (filter: AuditEventFilter = {}) => {
          requirePermission(currentUser, "audit.read");
          const items = auditEvents
            .filter((event) => {
              if (filter.objectType && event.objectType !== filter.objectType) return false;
              if (filter.objectId != null && event.objectId !== filter.objectId) return false;
              if (filter.actorId != null && event.actorUserId !== filter.actorId) return false;
              if (filter.action && event.action !== filter.action) return false;
              return true;
            })
            .map((event) => ({ ...event }));
          return paginate(items, filter.page, filter.pageSize);
        },
      },
      rolePermissions: async (): Promise<RolePermissionMatrix> => {
        requirePermission(currentUser, "role.permission.manage");
        return {
          permissions: permissionCatalog(),
          roles: roles.map((role) => rolePermissionEntry(role)),
        };
      },
      updateRolePermissions: async (role, input): Promise<RolePermissionEntry> => {
        const actor = requirePermission(currentUser, "role.permission.manage");
        if (!(roles as readonly string[]).includes(role)) {
          throw new ApiError("Role was not found.", "role.not_found", 404);
        }
        if (lockedRoles.includes(role)) {
          throw new ApiError("This role is locked and cannot be edited.", "role.locked", 409);
        }

        const catalog = permissionCatalog();
        const byCode = new Map(catalog.map((entry) => [entry.code, entry]));
        const selected = new Set<Permission>();
        for (const permission of input.permissions) {
          const entry = byCode.get(permission);
          if (!entry) {
            throw new ApiError(`Unknown permission ${permission}.`, "role.permission_invalid", 400);
          }
          if (selected.has(permission)) continue;
          selected.add(permission);
          if (!entry.delegable) {
            throw new ApiError(`${permission} is admin/root only.`, "role.permission_not_delegable", 400);
          }
          if (entry.scope !== roleScope(role)) {
            throw new ApiError(`${permission} does not belong to a ${roleScope(role)} role.`, "role.permission_scope_mismatch", 400);
          }
        }
        if (!input.reason.trim()) {
          throw new ApiError("A reason is required.", "role.permission_reason_required", 400);
        }

        const before = rolePermissionState.get(role) ?? [];
        // Keep the directory order rather than the request order so repeated
        // reads are stable and comparable.
        const after = catalog.filter((entry) => selected.has(entry.code)).map((entry) => entry.code);
        rolePermissionState.set(role, after);
        recordAudit(actor.id, "role.permissions.updated", "role", null, input.reason.trim(), {
          role,
          before: JSON.stringify(before),
          after: JSON.stringify(after),
        });
        return rolePermissionEntry(role);
      },
    },
  };
}

const archivedFromStatus = new Map<number, AuthoringProblem["publicationStatus"]>();

/** One role column; locked roles always report the whole directory. */
function rolePermissionEntry(role: Role): RolePermissionEntry {
  const locked = lockedRoles.includes(role);
  return {
    code: role,
    scope: roleScope(role),
    locked,
    permissions: locked ? permissionCatalog().map((entry) => entry.code) : [...(rolePermissionState.get(role) ?? [])],
  };
}

function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const current = Math.max(1, page);
  const size = Math.max(1, pageSize);
  return { items: items.slice((current - 1) * size, current * size), total: items.length };
}

function userStatusAction(status: AdminUser["status"]): AuditAction {
  switch (status) {
    case "active":
      return "user.enabled";
    case "deleted":
      return "user.deleted";
    default:
      return "user.disabled";
  }
}

function recordAudit(
  actorUserId: number,
  action: AuditAction,
  objectType: AuditObjectType,
  objectId: number | null,
  reason?: string,
  metadata?: Record<string, unknown>,
) {
  const event: AuditEvent = {
    id: nextAuditEventId++,
    actorUserId,
    action,
    objectType,
    objectId,
    createdAt: new Date().toISOString(),
  };
  const username = userHandle(actorUserId);
  if (username) event.actorUsername = username;
  if (reason) event.reason = reason;
  if (metadata) event.metadata = metadata;
  auditEvents.unshift(event);
}

function userHandle(userId: number): string | undefined {
  return adminUsers.find((user) => user.id === userId)?.handle;
}

function requireMockUser(user: CurrentUser | null): CurrentUser {
  if (!user) {
    throw new ApiError("Login is required.", "auth.required", 401);
  }
  return user;
}

/**
 * The generic denial names the permission, which is the most useful thing a
 * developer reading a log can get. Surfaces that already had a stable,
 * domain-worded denial pass `message` so their copy stays put — the authoring
 * console is asserted on by the e2e suite and by the browser contract.
 */
function requirePermission(user: CurrentUser | null, permission: Permission, message?: string): CurrentUser {
  const currentUser = requireMockUser(user);
  if (!currentUser.permissions.includes(permission)) {
    throw new ApiError(message ?? `${permission} permission is required.`, "auth.forbidden", 403);
  }
  return currentUser;
}

function requireAnyPermission(user: CurrentUser | null, permissions: Permission[], message?: string): CurrentUser {
  const currentUser = requireMockUser(user);
  if (!permissions.some((permission) => currentUser.permissions.includes(permission))) {
    throw new ApiError(message ?? `One of ${permissions.join(", ")} is required.`, "auth.forbidden", 403);
  }
  return currentUser;
}

const authoringAccessMessage = "Problem authoring access is required.";
const authoringPermissions: Permission[] = ["problem.create", "problem.review", "problem.manage_all"];

function requireAuthoringAccess(user: CurrentUser | null) {
  const currentUser = requireMockUser(user);
  if (!authoringPermissions.some((permission) => currentUser.permissions.includes(permission))) {
    // Mirrors the backend's `problem.forbidden` denial for `mine=true` lists.
    throw new ApiError(authoringAccessMessage, "problem.forbidden", 403);
  }
  return currentUser;
}

/**
 * The authoring write path (create, edit, statement, testcases, validation).
 * Kept separate from `requireAuthoringAccess` because the two answer different
 * questions: this one asks "may this session author at all", which the widened
 * list above answers, while the read path stays open to a reviewer who needs to
 * inspect a queue entry.
 */
function requireProblemAuthorAccess(user: CurrentUser | null): CurrentUser {
  return requirePermission(user, "problem.create", authoringAccessMessage);
}

/**
 * Mirrors the backend rule for contest role administration: an admin/root
 * session, the contest owner, or a `contest_manager` assignment inside that one
 * contest. Contest roles never appear in the global permission list, so the
 * assignment check cannot be replaced by a permission lookup.
 *
 * `allowJudge` widens the rule to a `contest_judge` session, which is what the
 * contest rejudge policy uses.
 */
function requireContestRoleManager(user: CurrentUser | null, contestId: number, options: { allowJudge?: boolean } = {}): CurrentUser {
  const currentUser = requireMockUser(user);
  if (currentUser.permissions.includes("contest.manage_all") || currentUser.permissions.includes("contest.manage")) {
    return currentUser;
  }
  if (options.allowJudge && currentUser.permissions.includes("contest.judge")) {
    return currentUser;
  }
  if (mockContests.some((contest) => contest.id === contestId && contest.ownerUserId === currentUser.id)) {
    return currentUser;
  }
  const acceptedRoles: ContestRole[] = options.allowJudge ? ["contest_manager", "contest_judge"] : ["contest_manager"];
  const holdsScopedRole = contestRoleAssignments.some(
    (assignment) =>
      assignment.contestId === contestId && assignment.userId === currentUser.id && acceptedRoles.includes(assignment.role),
  );
  if (holdsScopedRole) {
    return currentUser;
  }
  throw new ApiError(
    options.allowJudge ? "Contest judge access is required." : "Contest manager access is required.",
    "contest.not_allowed",
    403,
  );
}

/**
 * Mirrors the backend split for rejudge targets: a problem target needs
 * `submission.rejudge`, while a contest target is a contest-judge decision
 * (admin/root, the contest owner, a contest manager, or a contest judge).
 */
function authorizeRejudge(user: CurrentUser | null, problemId?: number, contestId?: number): CurrentUser {
  const actor = requireMockUser(user);
  if ((problemId == null) === (contestId == null)) {
    throw new ApiError("Exactly one of a problem or contest target is required.", "rejudge.target_invalid", 400);
  }
  if (problemId != null) {
    return requirePermission(actor, "submission.rejudge");
  }
  return requireContestRoleManager(actor, contestId as number, { allowJudge: true });
}

/**
 * Mirrors the backend's `withFrontendContract` for `current_user_roles`: a
 * caller only ever sees their own contest-scoped roles, and only for the contest
 * being read. The fixtures carry an empty list, so without this the contests
 * endpoints would look role-less in mock mode and every contest-scoped surface
 * would resolve to "denied".
 */
function withScopedRoles(contest: ContestSummary, user: CurrentUser | null): ContestSummary {
  const userId = user?.id;
  const currentUserRoles =
    userId === undefined
      ? []
      : contestRoleAssignments.filter((assignment) => assignment.contestId === contest.id && assignment.userId === userId).map((assignment) => assignment.role);
  return { ...contest, currentUserRoles };
}

function demoteAuthoredProblem(id: number) {
  const index = authoredProblems.findIndex((problem) => problem.id === id);
  if (index >= 0 && authoredProblems[index].publicationStatus !== "draft") {
    authoredProblems[index] = { ...authoredProblems[index], publicationStatus: "draft" };
  }
}

/** 演示运行输出：回显 stdin，让「输入 → 输出」这条链路肉眼可见。 */
function mockRunStdout(stdin: string | undefined) {
  const text = stdin?.trim();
  return text ? `${text}\n` : "(demo run) hello from the mock judge\n";
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomHex(length: number) {
  let value = "";
  while (value.length < length) value += Math.floor(Math.random() * 16).toString(16);
  return value.slice(0, length);
}
