import { createHttpAdapter } from "./http-adapter";
import { createMockAdapter } from "./mock-adapter";
import { getApiMode } from "./mode";
import { readBrowserSession, restoreSession } from "@/lib/auth/session";
import type { ApiClient, ApiMode } from "./types";

type ClientOptions = {
  mode?: ApiMode;
  accessToken?: string;
};

export function createApiClient(options: ClientOptions = {}): ApiClient {
  const mode = options.mode ?? getApiMode();
  const session = browserSession();
  // A getter keeps long-lived clients on the latest rotated browser token.
  // Explicit tokens and server-side clients keep their existing behavior.
  const accessToken = options.accessToken ?? (typeof window !== "undefined" ? () => readBrowserSession()?.accessToken : undefined);

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
