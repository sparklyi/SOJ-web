import { ApiError } from "./errors";
import { request } from "./http-client";
import type {
  AuthResponse,
  ContestRegistrationResponse,
  ContestResponse,
  LanguageResponse,
  LoginRequest,
  PageResponse,
  ProblemResponse,
  ProblemStatementResponse,
  ProblemStatsResponse,
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
import type { ApiClient, CurrentUser, JudgeLanguage, PageResult } from "./types";
import { mapContestRegistration, mapContestResponse, mapContestScoreboard } from "./contest-mappers";
import { mapProblemDetail, mapProblemSummary } from "./problem-mappers";
import { mapRunSummary, mapSubmissionSummary } from "./submission-mappers";

const LANGUAGE_LIST_PATH = "/api/v1/admin/languages";

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
