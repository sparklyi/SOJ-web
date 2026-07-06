import { createHttpAdapter } from "./http-adapter";
import { createMockAdapter } from "./mock-adapter";
import { getApiMode } from "./mode";
import type { ApiClient, ApiMode } from "./types";

type ClientOptions = {
  mode?: ApiMode;
};

export function createApiClient(options: ClientOptions = {}): ApiClient {
  const mode = options.mode ?? getApiMode();
  return mode === "http" ? createHttpAdapter() : createMockAdapter();
}
