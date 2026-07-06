import { ApiError } from "./errors";
import type { ApiClient } from "./types";

function notConnected(): never {
  throw new ApiError("HTTP API adapter is not connected yet.", "api.not_connected", 501);
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
  };
}
