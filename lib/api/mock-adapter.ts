import { ApiError, notFound } from "./errors";
import { createMockSession } from "@/lib/auth/session";
import { buildScoreboardModel } from "@/lib/domain/scoreboard";
import {
  mockAcmScoreboardRows,
  mockAdminUsers,
  mockContests,
  mockContestRoleAssignments,
  mockLanguages,
  mockOiScoreboardRows,
  mockProblems,
  mockProblemsAwaitingReview,
  mockRejudgeBatchItems,
  mockRejudgeBatches,
  mockReviewEvents,
  mockSubmissions,
  mockUser,
} from "@/lib/mock/fixtures";
import type { ContestRole, GlobalRole, Permission } from "@/lib/auth/permissions";
import type {
  AdminUser,
  ApiClient,
  AuthoringProblem,
  AuthoringStatement,
  AuthoringTestcaseSet,
  ContestRoleAssignment,
  ContestSummary,
  CurrentUser,
  GlobalRoleAssignment,
  ProblemCheckRun,
  ProblemReviewEvent,
  RejudgeBatch,
  RejudgeBatchItem,
  RunSummary,
  SubmissionSummary,
} from "./types";

type MockAdapterOptions = {
  currentUser?: CurrentUser | null;
};

const createdSubmissions: SubmissionSummary[] = [];
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
}));

const authoringStatements = new Map<number, AuthoringStatement>();
const authoringTestcaseSets = new Map<number, AuthoringTestcaseSet>();
const authoringChecks = new Map<number, ProblemCheckRun>();
const reviewEvents = new Map<number, ProblemReviewEvent[]>();
const contestRoleAssignments: ContestRoleAssignment[] = [...mockContestRoleAssignments];
const adminUsers: AdminUser[] = mockAdminUsers.map((user) => ({ ...user, roles: [...user.roles] }));
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
    source: "SOJ",
  };
  const testcaseSet: AuthoringTestcaseSet = {
    id: nextTestcaseSetId++,
    problemId: problem.id,
    version: 1,
    checksumSha256: "mock-checksum",
    sizeBytes: 1024,
    caseCount: 1,
    status: "ready",
    isCurrent: true,
  };
  const check: ProblemCheckRun = {
    id: nextCheckId++,
    problemId: problem.id,
    testcaseSetId: testcaseSet.id,
    status: "completed",
    summary: { caseCount: 1, expectedCaseCount: 1, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
    findings: [],
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
      // 站点策略与后端 SOJ 一致：题库内容（列表、详情）只对已登录 actor 开放。
      list: async () => {
        requireMockUser(currentUser);
        return { items: mockProblems, total: mockProblems.length };
      },
      get: async (id) => {
        requireMockUser(currentUser);
        const problem = mockProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        return problem;
      },
      listMine: async () => {
        const actor = requireAuthoringAccess(currentUser);
        const items = authoredProblems.filter((problem) => problem.ownerUserId === actor.id);
        return { items, total: items.length };
      },
      create: async (input) => {
        const problem: AuthoringProblem = { ...input, id: nextProblemId++, publicationStatus: "draft", ownerUserId: requireProblemAuthorAccess(currentUser).id };
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
        const statement: AuthoringStatement = { ...input, problemId: id, version: (authoringStatements.get(id)?.version ?? 0) + 1 };
        authoringStatements.set(id, statement);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return statement;
      },
      uploadTestcases: async (id, input) => {
        requireProblemAuthorAccess(currentUser);
        const testcaseSet: AuthoringTestcaseSet = {
          id: nextTestcaseSetId++,
          problemId: id,
          version: (authoringTestcaseSets.get(id)?.version ?? 0) + 1,
          checksumSha256: "mock-checksum",
          sizeBytes: input.archive.size,
          caseCount: input.caseCount,
          status: "ready",
          isCurrent: true,
        };
        authoringTestcaseSets.set(id, testcaseSet);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return testcaseSet;
      },
      getAuthoringState: async (id) => {
        requireAuthoringAccess(currentUser);
        const problem = authoredProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        const statement = authoringStatements.get(id);
        const testcaseSet = authoringTestcaseSets.get(id);
        const latestCheck = authoringChecks.get(id);
        const blockers = [
          ...(!statement ? [{ code: "problem.statement_required", message: "Current statement is required." }] : []),
          ...(!testcaseSet ? [{ code: "problem.testcase_required", message: "Current testcase set is required." }] : []),
          ...(testcaseSet && !latestCheck ? [{ code: "problem.check_required", message: "Run a problem check." }] : []),
        ];
        return { problem, statement, testcaseSet, latestCheck, publishable: blockers.length === 0 && Boolean(latestCheck?.summary.valid), blockers };
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
          summary: { caseCount: testcaseSet.caseCount, expectedCaseCount: testcaseSet.caseCount, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
          findings: [],
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
      create: async (input) => {
        const problem = mockProblems.find((item) => item.id === input.problemId);
        const submission: SubmissionSummary = {
          id: nextSubmissionId++,
          problemId: input.problemId,
          problemTitle: problem?.title ?? `Problem #${input.problemId}`,
          contestId: input.contestId,
          status: "queued",
          score: 0,
          submittedAt: new Date().toISOString(),
        };
        createdSubmissions.unshift(submission);
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

        return contest.type === "acm"
          ? buildScoreboardModel({ type: "acm", rows: mockAcmScoreboardRows })
          : buildScoreboardModel({ type: "oi", rows: mockOiScoreboardRows });
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
        const items = mockLanguages.filter((language) => {
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
        languages: mockLanguages.filter((language) => language.enabled).length,
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
        return { items, total: items.length };
      },
      updateUser: async (id, input) => {
        requirePermission(currentUser, "user.manage");
        const index = adminUsers.findIndex((user) => user.id === id);
        if (index < 0) throw notFound("User", id);
        const next: AdminUser = { ...adminUsers[index], roles: [...adminUsers[index].roles], updatedAt: new Date().toISOString() };
        if (input.username !== undefined) next.handle = input.username;
        if (input.status !== undefined) next.status = input.status;
        adminUsers[index] = next;
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
        return assignment;
      },
      revokeRole: async (id, input) => {
        requirePermission(currentUser, "role.revoke");
        const index = adminUsers.findIndex((user) => user.id === id);
        if (index < 0) throw notFound("User", id);
        const roles = adminUsers[index].roles.filter((role) => role !== input.role);
        if (roles.length === adminUsers[index].roles.length) throw notFound("Role assignment", id);
        adminUsers[index] = { ...adminUsers[index], roles };
      },
    },
  };
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

function requireAuthoringAccess(user: CurrentUser | null) {
  return requireAnyPermission(user, ["problem.create", "problem.review", "problem.manage_all"], authoringAccessMessage);
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
