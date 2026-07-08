import { createHttpAdapter } from "./http-adapter";
import { createMockAdapter } from "./mock-adapter";
import { getApiMode } from "./mode";
import { restoreSession } from "@/lib/auth/session";
import type { ApiClient, ApiMode } from "./types";

type ClientOptions = {
  mode?: ApiMode;
  accessToken?: string;
};

export function createApiClient(options: ClientOptions = {}): ApiClient {
  const mode = options.mode ?? getApiMode();
  const session = browserSession();
  const accessToken = options.accessToken ?? session?.accessToken;

  return mode === "http" ? createHttpAdapter({ accessToken }) : createMockAdapter({ currentUser: session?.user });
}

export function createBrowserApiClient(options: ClientOptions = {}): ApiClient {
  return createApiClient(options);
}

function browserSession() {
  if (typeof window === "undefined") return null;

  try {
    return restoreSession(window.localStorage);
  } catch {
    return null;
  }
}
