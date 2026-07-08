import { ApiError } from "./errors";
import { request } from "./http-client";
import type { LanguageResponse, PageResponse } from "./backend-types";
import type { ApiClient, JudgeLanguage, PageResult } from "./types";

function notConnected(): never {
  throw new ApiError("HTTP API adapter is not connected yet.", "api.not_connected", 501);
}

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

export function createHttpAdapter(options: HttpAdapterOptions = {}): ApiClient {
  return {
    auth: {
      me: async () => notConnected(),
    },
    problems: {
      list: async () => notConnected(),
      get: async () => notConnected(),
    },
    submissions: {
      list: async () => notConnected(),
      get: async () => notConnected(),
    },
    contests: {
      list: async () => notConnected(),
      get: async () => notConnected(),
    },
    languages: {
      list: async (filter = {}): Promise<PageResult<JudgeLanguage>> => {
        const data = await request<PageResponse<LanguageResponse>>("/api/v1/admin/languages", {
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
