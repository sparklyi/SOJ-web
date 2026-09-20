import { ApiError } from "./errors";
import { request } from "./http-client";
import type {
  AdminUserUpdateRequest,
  AuthResponse,
  ContestRegistrationResponse,
  ContestResponse,
  ContestRoleAssignmentPageResponse,
  ContestRoleAssignmentResponse,
  ContestRoleGrantRequest,
  ContestRoleRevokeRequest,
  LanguageResponse,
  LoginRequest,
  PageResponse,
  ProblemAuthoringStateResponse,
  ProblemCheckResponse,
  ProblemResponse,
  ProblemReviewDecisionRequest,
  ProblemReviewEventPageResponse,
  ProblemReviewEventResponse,
  ProblemReviewQueueResponse,
  ProblemStatementResponse,
  ProblemStatsResponse,
  RejudgeBatchCancelRequest,
  RejudgeBatchCreateRequest,
  RejudgeBatchDetailResponse,
  RejudgeBatchItemResponse,
  RejudgeBatchPageResponse,
  RejudgeBatchResponse,
  RoleAssignmentResponse,
  RoleGrantRequest,
  RoleRevokeRequest,
  TestcaseSetResponse,
  RefreshRequest,
  RegisterRequest,
  RunCreateRequest,
  RunResponse,
  ScoreboardResponse,
  SubmissionCreateRequest,
  SubmissionResponse,
  UserPageResponse,
  UserResponse,
} from "./backend-types";
import type { AuthSession } from "@/lib/auth/session";
import { isGlobalRole } from "@/lib/auth/permissions";
import type {
  AdminUser,
  ApiClient,
  AuthoringProblem,
  AuthoringStatement,
  AuthoringTestcaseSet,
  CurrentUser,
  GlobalRoleAssignment,
  JudgeLanguage,
  PageResult,
  ProblemCheckRun,
  ProblemReviewEvent,
  RejudgeBatch,
  RejudgeBatchDetail,
  RejudgeBatchItem,
} from "./types";
import { mapContestRegistration, mapContestResponse, mapContestRoleAssignment, mapContestScoreboard } from "./contest-mappers";
import { mapProblemDetail, mapProblemSummary } from "./problem-mappers";
import { mapRunSummary, mapSubmissionSummary } from "./submission-mappers";

const LANGUAGE_LIST_PATH = "/api/v1/languages";

type HttpAdapterOptions = {
  accessToken?: string;
};

function mapLanguage(input: LanguageResponse): JudgeLanguage {
  return {
    id: input.id,
    engine: input.engine,
    engineLanguageId: input.engine_language_id,
    name: input.name,
    version: input.version ?? undefined,
    compileCommand: input.compile_command ?? undefined,
    runCommand: input.run_command ?? undefined,
    defaultTimeLimitMs: input.default_time_limit_ms,
    defaultMemoryLimitKb: input.default_memory_limit_kb,
    enabled: input.enabled,
  };
}

function mapUser(input: UserResponse): CurrentUser {
  return {
    id: input.id,
    handle: input.username,
    displayName: input.username,
    roles: input.roles,
    permissions: input.permissions,
  };
}

function mapAdminUser(input: UserResponse): AdminUser {
  return {
    id: input.id,
    email: input.email,
    handle: input.username,
    status: input.status,
    roles: (input.roles ?? []).filter(isGlobalRole),
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}

function mapGlobalRoleAssignment(input: RoleAssignmentResponse): GlobalRoleAssignment {
  const assignment: GlobalRoleAssignment = {
    id: input.id,
    userId: input.user_id,
    role: input.role as GlobalRoleAssignment["role"],
    grantedAt: input.granted_at,
  };
  if (input.granted_by != null) assignment.grantedBy = input.granted_by;
  return assignment;
}

function mapReviewEvent(input: ProblemReviewEventResponse): ProblemReviewEvent {
  const event: ProblemReviewEvent = {
    id: input.id,
    problemId: input.problem_id,
    actorUserId: input.actor_user_id,
    fromStatus: input.from_status,
    toStatus: input.to_status,
    decision: input.decision,
    createdAt: input.created_at,
  };
  if (input.comment) event.comment = input.comment;
  return event;
}

function mapRejudgeBatch(input: RejudgeBatchResponse): RejudgeBatch {
  const batch: RejudgeBatch = {
    id: input.id,
    requestedBy: input.requested_by,
    status: input.status,
    reason: input.reason,
    totalCount: input.total_count,
    completedCount: input.completed_count,
    failedCount: input.failed_count,
    canceledCount: input.canceled_count,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
  if (input.problem_id != null) batch.problemId = input.problem_id;
  if (input.contest_id != null) batch.contestId = input.contest_id;
  if (input.error_message) batch.errorMessage = input.error_message;
  if (input.started_at) batch.startedAt = input.started_at;
  if (input.finished_at) batch.finishedAt = input.finished_at;
  return batch;
}

function mapRejudgeBatchItem(input: RejudgeBatchItemResponse): RejudgeBatchItem {
  const item: RejudgeBatchItem = {
    id: input.id,
    batchId: input.batch_id,
    submissionId: input.submission_id,
    taskId: input.task_id,
    status: input.status,
  };
  if (input.attempt_id != null) item.attemptId = input.attempt_id;
  if (input.error_message) item.errorMessage = input.error_message;
  if (input.started_at) item.startedAt = input.started_at;
  if (input.finished_at) item.finishedAt = input.finished_at;
  return item;
}

function mapAuthoringProblem(input: ProblemResponse): AuthoringProblem {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    difficulty: input.difficulty,
    visibility: input.visibility,
    publicationStatus: input.status,
    tags: input.tags,
    timeLimitMs: input.limits.time_limit_ms,
    memoryLimitKb: input.limits.memory_limit_kb,
    ownerUserId: input.owner_user_id,
  };
}

function mapAuthoringStatement(input: ProblemStatementResponse): AuthoringStatement {
  return {
    problemId: input.problem_id,
    version: input.version,
    title: input.title,
    description: input.description,
    inputDescription: input.input_description ?? "",
    outputDescription: input.output_description ?? "",
    samples: input.samples,
    hint: input.hint ?? "",
    source: input.source ?? "",
  };
}

function mapTestcaseSet(input: TestcaseSetResponse): AuthoringTestcaseSet {
  return {
    id: input.id,
    problemId: input.problem_id,
    version: input.version,
    checksumSha256: input.checksum_sha256,
    sizeBytes: input.size_bytes,
    caseCount: input.case_count,
    status: input.status,
    isCurrent: input.is_current,
  };
}

function mapProblemCheck(input: ProblemCheckResponse): ProblemCheckRun {
  return {
    id: input.id,
    problemId: input.problem_id,
    statementId: input.statement_id ?? undefined,
    testcaseSetId: input.testcase_set_id ?? undefined,
    status: input.status,
    summary: {
      caseCount: input.summary.case_count,
      expectedCaseCount: input.summary.expected_case_count,
      findingCount: input.summary.finding_count,
      errorCount: input.summary.error_count,
      warningCount: input.summary.warning_count,
      infoCount: input.summary.info_count,
      storageReadable: input.summary.storage_readable,
      zipReadable: input.summary.zip_readable,
      valid: input.summary.valid,
    },
    findings: input.findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      code: finding.code,
      message: finding.message,
      caseIndex: finding.case_index ?? undefined,
      testcaseKey: finding.testcase_key ?? undefined,
    })),
  };
}

function mapAuthSession(input: AuthResponse, now: Date = new Date()): AuthSession {
  return {
    accessToken: input.access_token,
    refreshToken: input.refresh_token,
    user: mapUser(input.user),
    expiresAt: new Date(now.getTime() + input.expires_in * 1000).toISOString(),
  };
}

export function createHttpAdapter(options: HttpAdapterOptions = {}): ApiClient {
  return {
    auth: {
      login: async (input) => {
        const data = await request<AuthResponse>("/api/v1/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: input.email, password: input.password } satisfies LoginRequest),
        });
        return mapAuthSession(data);
      },
      register: async (input) => {
        const data = await request<AuthResponse>("/api/v1/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: input.email, username: input.username, password: input.password } satisfies RegisterRequest),
        });
        return mapAuthSession(data);
      },
      refresh: async (input) => {
        const data = await request<AuthResponse>("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: input.refreshToken } satisfies RefreshRequest),
        });
        return mapAuthSession(data);
      },
      logout: async (input) => {
        const body = input?.refreshToken ? JSON.stringify({ refresh_token: input.refreshToken } satisfies { refresh_token: string }) : undefined;
        await request<undefined>("/api/v1/auth/logout", {
          accessToken: options.accessToken,
          method: "POST",
          ...(body
            ? {
                headers: { "content-type": "application/json" },
                body,
              }
            : {}),
        });
      },
      me: async () => {
        try {
          const data = await request<UserResponse>("/api/v1/me", {
            accessToken: options.accessToken,
          });
          return mapUser(data);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return null;
          throw error;
        }
      },
    },
    problems: {
      list: async () => {
        const data = await request<PageResponse<ProblemResponse>>("/api/v1/problems", {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 100,
          },
        });
        const statsByProblem = await Promise.all(
          data.items.map((problem) =>
            request<ProblemStatsResponse>(`/api/v1/problems/${problem.id}/stats`, {
              accessToken: options.accessToken,
            }),
          ),
        );
        const items = data.items.map((problem, index) => mapProblemSummary(problem, statsByProblem[index]));
        return { items, total: data.total };
      },
      get: async (id) => {
        const [problem, statement, stats] = await Promise.all([
          request<ProblemResponse>(`/api/v1/problems/${id}`, {
            accessToken: options.accessToken,
          }),
          request<ProblemStatementResponse>(`/api/v1/problems/${id}/statement`, {
            accessToken: options.accessToken,
          }),
          request<ProblemStatsResponse>(`/api/v1/problems/${id}/stats`, {
            accessToken: options.accessToken,
          }),
        ]);
        return mapProblemDetail(problem, statement, stats);
      },
      listMine: async () => {
        const data = await request<PageResponse<ProblemResponse>>("/api/v1/problems", {
          accessToken: options.accessToken,
          query: { page: 1, page_size: 100, mine: true },
        });
        return { items: data.items.map(mapAuthoringProblem), total: data.total };
      },
      create: async (input) => {
        const data = await request<ProblemResponse>("/api/v1/problems", {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            slug: input.slug,
            difficulty: input.difficulty,
            visibility: input.visibility,
            time_limit_ms: input.timeLimitMs,
            memory_limit_kb: input.memoryLimitKb,
            tags: input.tags,
          }),
        });
        return mapAuthoringProblem(data);
      },
      update: async (id, input) => {
        const data = await request<ProblemResponse>(`/api/v1/problems/${id}`, {
          accessToken: options.accessToken,
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            slug: input.slug,
            difficulty: input.difficulty,
            visibility: input.visibility,
            time_limit_ms: input.timeLimitMs,
            memory_limit_kb: input.memoryLimitKb,
            tags: input.tags,
          }),
        });
        return mapAuthoringProblem(data);
      },
      saveStatement: async (id, input) => {
        const data = await request<ProblemStatementResponse>(`/api/v1/problems/${id}/statement`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            input_description: input.inputDescription,
            output_description: input.outputDescription,
            samples: input.samples,
            hint: input.hint,
            source: input.source,
          }),
        });
        return mapAuthoringStatement(data);
      },
      uploadTestcases: async (id, input) => {
        const form = new FormData();
        form.set("archive", input.archive);
        form.set("case_count", String(input.caseCount));
        form.set("checksum_sha256", await fileSha256(input.archive));
        const data = await request<TestcaseSetResponse>(`/api/v1/problems/${id}/testcase-sets`, {
          accessToken: options.accessToken,
          method: "POST",
          body: form,
        });
        return mapTestcaseSet(data);
      },
      getAuthoringState: async (id) => {
        const data = await request<ProblemAuthoringStateResponse>(`/api/v1/problems/${id}/authoring`, { accessToken: options.accessToken });
        return {
          problem: mapAuthoringProblem(data.problem),
          statement: data.statement ? mapAuthoringStatement(data.statement) : undefined,
          testcaseSet: data.testcase_set ? mapTestcaseSet(data.testcase_set) : undefined,
          latestCheck: data.latest_check ? mapProblemCheck(data.latest_check) : undefined,
          publishable: data.publishable,
          blockers: data.blockers,
        };
      },
      runCheck: async (id) => {
        const data = await request<ProblemCheckResponse>(`/api/v1/problems/${id}/checks`, {
          accessToken: options.accessToken,
          method: "POST",
        });
        return mapProblemCheck(data);
      },
      submitReview: async (id) => {
        const data = await request<ProblemResponse>(`/api/v1/problems/${id}/review`, {
          accessToken: options.accessToken,
          method: "POST",
        });
        return mapAuthoringProblem(data);
      },
      reviewQueue: async () => {
        const data = await request<ProblemReviewQueueResponse>("/api/v1/problems/review-queue", {
          accessToken: options.accessToken,
          query: { page: 1, page_size: 100 },
        });
        return { items: data.items.map(mapAuthoringProblem), total: data.total };
      },
      decideReview: async (id, input) => {
        const body: ProblemReviewDecisionRequest = { decision: input.decision };
        if (input.comment) body.comment = input.comment;
        const data = await request<ProblemResponse>(`/api/v1/problems/${id}/review/decision`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapAuthoringProblem(data);
      },
      reviewEvents: async (id) => {
        const data = await request<ProblemReviewEventPageResponse>(`/api/v1/problems/${id}/review/events`, {
          accessToken: options.accessToken,
        });
        return data.items.map(mapReviewEvent);
      },
    },
    submissions: {
      list: async () => {
        const data = await request<PageResponse<SubmissionResponse>>("/api/v1/submissions", {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 100,
          },
        });
        return { items: data.items.map(mapSubmissionSummary), total: data.total };
      },
      get: async (id) => {
        const data = await request<SubmissionResponse>(`/api/v1/submissions/${id}`, {
          accessToken: options.accessToken,
        });
        return mapSubmissionSummary(data);
      },
      create: async (input) => {
        const data = await request<SubmissionResponse>("/api/v1/submissions", {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            problem_id: input.problemId,
            contest_id: input.contestId,
            language_id: input.languageId,
            source_code: input.sourceCode,
          } satisfies SubmissionCreateRequest),
        });
        return mapSubmissionSummary(data);
      },
    },
    runs: {
      create: async (input) => {
        const data = await request<RunResponse>("/api/v1/runs", {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            problem_id: input.problemId,
            language_id: input.languageId,
            source_code: input.sourceCode,
            stdin: input.stdin,
          } satisfies RunCreateRequest),
        });
        return mapRunSummary(data);
      },
      get: async (id) => {
        const data = await request<RunResponse>(`/api/v1/runs/${id}`, {
          accessToken: options.accessToken,
        });
        return mapRunSummary(data);
      },
    },
    contests: {
      list: async () => {
        const data = await request<PageResponse<ContestResponse>>("/api/v1/contests", {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 100,
          },
        });
        return { items: data.items.map((contest) => mapContestResponse(contest)), total: data.total };
      },
      get: async (id) => {
        const data = await request<ContestResponse>(`/api/v1/contests/${id}`, {
          accessToken: options.accessToken,
        });
        return mapContestResponse(data);
      },
      register: async (id, input) => {
        const data = await request<ContestRegistrationResponse>(`/api/v1/contests/${id}/registrations`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            display_name: input.displayName,
            email: input.email,
            invite_code: input.inviteCode,
          }),
        });
        return mapContestRegistration(data);
      },
      scoreboard: async (id) => {
        const rows: ScoreboardResponse["rows"] = [];
        let cursor: string | undefined;
        let firstPage: ScoreboardResponse | undefined;

        for (let page = 0; page < 10; page += 1) {
          const data = await request<ScoreboardResponse>(`/api/v1/contests/${id}/scoreboard`, {
            accessToken: options.accessToken,
            query: { page_size: 100, cursor },
          });
          firstPage ??= data;
          rows.push(...data.rows);
          cursor = data.next_cursor;
          if (!cursor) break;
        }

        if (cursor || !firstPage) {
          throw new ApiError("Scoreboard has too many rows to load.", "api.pagination_limit", 200);
        }

        return mapContestScoreboard({ ...firstPage, rows, next_cursor: undefined });
      },
      listRoles: async (id) => {
        const data = await request<ContestRoleAssignmentPageResponse>(`/api/v1/contests/${id}/roles`, {
          accessToken: options.accessToken,
        });
        return data.items.map(mapContestRoleAssignment);
      },
      grantRole: async (id, input) => {
        const body: ContestRoleGrantRequest = { user_id: input.userId, role: input.role, reason: input.reason };
        const data = await request<ContestRoleAssignmentResponse>(`/api/v1/contests/${id}/roles`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapContestRoleAssignment(data);
      },
      revokeRole: async (id, input) => {
        const body: ContestRoleRevokeRequest = { reason: input.reason };
        await request<undefined>(`/api/v1/contests/${id}/roles/${input.role}/users/${input.userId}`, {
          accessToken: options.accessToken,
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      },
    },
    languages: {
      list: async (filter = {}): Promise<PageResult<JudgeLanguage>> => {
        const data = await request<PageResponse<LanguageResponse>>(LANGUAGE_LIST_PATH, {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 100,
            engine: filter.engine,
          },
        });
        const items = data.items.map(mapLanguage);
        return { items, total: data.total };
      },
    },
    rejudge: {
      list: async (filter = {}) => {
        const data = await request<RejudgeBatchPageResponse>("/api/v1/rejudge-batches", {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 50,
            problem_id: filter.problemId,
            contest_id: filter.contestId,
            status: filter.status,
          },
        });
        return { items: data.items.map(mapRejudgeBatch), total: data.total };
      },
      create: async (input) => {
        const body: RejudgeBatchCreateRequest = { reason: input.reason };
        if (input.problemId != null) body.problem_id = input.problemId;
        if (input.contestId != null) body.contest_id = input.contestId;
        const data = await request<RejudgeBatchResponse>("/api/v1/rejudge-batches", {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapRejudgeBatch(data);
      },
      get: async (id): Promise<RejudgeBatchDetail> => {
        const data = await request<RejudgeBatchDetailResponse>(`/api/v1/rejudge-batches/${id}`, {
          accessToken: options.accessToken,
        });
        return { batch: mapRejudgeBatch(data.batch), items: data.items.map(mapRejudgeBatchItem) };
      },
      cancel: async (id, input) => {
        const body: RejudgeBatchCancelRequest = { reason: input.reason };
        const data = await request<RejudgeBatchResponse>(`/api/v1/rejudge-batches/${id}/cancel`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapRejudgeBatch(data);
      },
    },
    admin: {
      listUsers: async (filter = {}) => {
        const data = await request<UserPageResponse>("/api/v1/admin/users", {
          accessToken: options.accessToken,
          query: {
            page: filter.page ?? 1,
            page_size: filter.pageSize ?? 50,
            keyword: filter.keyword,
            status: filter.status,
          },
        });
        return { items: data.items.map(mapAdminUser), total: data.total };
      },
      updateUser: async (id, input) => {
        const body: AdminUserUpdateRequest = {};
        if (input.username !== undefined) body.username = input.username;
        if (input.bio !== undefined) body.bio = input.bio;
        if (input.status !== undefined) body.status = input.status;
        const data = await request<UserResponse>(`/api/v1/admin/users/${id}`, {
          accessToken: options.accessToken,
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapAdminUser(data);
      },
      grantRole: async (id, input) => {
        const body: RoleGrantRequest = { role: input.role, reason: input.reason };
        const data = await request<RoleAssignmentResponse>(`/api/v1/admin/users/${id}/roles`, {
          accessToken: options.accessToken,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return mapGlobalRoleAssignment(data);
      },
      revokeRole: async (id, input) => {
        const body: RoleRevokeRequest = { reason: input.reason };
        await request<undefined>(`/api/v1/admin/users/${id}/roles/${input.role}`, {
          accessToken: options.accessToken,
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      },
    },
  };
}

async function fileSha256(file: File) {
  const bytes = typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : await fileReaderArrayBuffer(file);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fileReaderArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read testcase archive."));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}
