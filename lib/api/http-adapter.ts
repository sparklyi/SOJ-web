import { ApiError } from "./errors";
import { request } from "./http-client";
import type {
  AuthResponse,
  ContestRegistrationResponse,
  ContestResponse,
  LanguageResponse,
  LoginRequest,
  PageResponse,
  ProblemAuthoringStateResponse,
  ProblemCheckResponse,
  ProblemResponse,
  ProblemStatementResponse,
  ProblemStatsResponse,
  TestcaseSetResponse,
  RefreshRequest,
  RegisterRequest,
  RunCreateRequest,
  RunResponse,
  ScoreboardResponse,
  SubmissionCreateRequest,
  SubmissionResponse,
  UserResponse,
} from "./backend-types";
import type { AuthSession } from "@/lib/auth/session";
import type { ApiClient, AuthoringProblem, AuthoringStatement, AuthoringTestcaseSet, CurrentUser, JudgeLanguage, PageResult, ProblemCheckRun } from "./types";
import { mapContestRegistration, mapContestResponse, mapContestScoreboard } from "./contest-mappers";
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
    role: input.role,
  };
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
      logout: async () => {
        await request<undefined>("/api/v1/auth/logout", {
          accessToken: options.accessToken,
          method: "POST",
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
      publish: async (id) => {
        const data = await request<ProblemResponse>(`/api/v1/problems/${id}`, {
          accessToken: options.accessToken,
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
        return mapAuthoringProblem(data);
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
        const data = await request<ScoreboardResponse>(`/api/v1/contests/${id}/scoreboard`, {
          accessToken: options.accessToken,
        });
        return mapContestScoreboard(data);
      },
    },
    languages: {
      list: async (filter = {}): Promise<PageResult<JudgeLanguage>> => {
        const data = await request<PageResponse<LanguageResponse>>(LANGUAGE_LIST_PATH, {
          accessToken: options.accessToken,
          query: {
            page: 1,
            page_size: 100,
            enabled: filter.enabled,
            engine: filter.engine,
          },
        });
        const items = data.items.map(mapLanguage);
        return { items, total: data.total };
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
