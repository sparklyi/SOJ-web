import { ApiError } from "./errors";
import type { ApiClient, JudgeLanguage, PageResult } from "./types";

function notConnected(): never {
  throw new ApiError("HTTP API adapter is not connected yet.", "api.not_connected", 501);
}

type Envelope<T> = {
  data?: T;
  error?: { code: string; message: string } | null;
};

type LanguageResponse = {
  id: number;
  engine: string;
  engine_language_id: string;
  name: string;
  version?: string | null;
  compile_command?: string | null;
  run_command?: string | null;
  default_time_limit_ms: number;
  default_memory_limit_kb: number;
  enabled: boolean;
};

type LanguagePageResponse = {
  items: LanguageResponse[];
  total: number;
};

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_SOJ_API_BASE_URL ?? "http://localhost:8080";
}

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" });
  const envelope = (await response.json()) as Envelope<T>;

  if (!response.ok || envelope.error) {
    throw new ApiError(envelope.error?.message ?? "HTTP API request failed.", envelope.error?.code ?? "api.request_failed", response.status);
  }

  if (typeof envelope.data === "undefined") {
    throw new ApiError("HTTP API response did not include data.", "api.invalid_response", response.status);
  }

  return envelope.data;
}

export function createHttpAdapter(): ApiClient {
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
        const params = new URLSearchParams({ page: "1", page_size: "100" });
        if (typeof filter.enabled === "boolean") params.set("enabled", String(filter.enabled));
        if (filter.engine) params.set("engine", filter.engine);
        const data = await getJson<LanguagePageResponse>(`/api/v1/admin/languages?${params.toString()}`);
        const items = data.items.map(mapLanguage);
        return { items, total: data.total };
      },
    },
  };
}
