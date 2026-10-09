import { ApiError, type ApiErrorDetails } from "./errors";
import type { AuthResponse, BackendError, Envelope } from "./backend-types";
import { mapAuthSession } from "./auth-mappers";
import { clearSession, readBrowserSession, saveSession, type AuthSession } from "@/lib/auth/session";
import type { TestcaseFinding } from "./types";

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = Omit<RequestInit, "cache"> & {
  accessToken?: string | (() => string | undefined);
  query?: Record<string, QueryValue | QueryValue[]>;
};

export function apiBaseUrl() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_SOJ_API_BASE_URL;

  if (typeof window === "undefined") {
    if (publicBaseUrl?.startsWith("/")) {
      return process.env.SOJ_API_INTERNAL_BASE_URL ?? "http://localhost:8080";
    }
    return publicBaseUrl ?? process.env.SOJ_API_INTERNAL_BASE_URL ?? "http://localhost:8080";
  }

  if (process.env.NODE_ENV === "test") {
    return publicBaseUrl ?? "http://localhost:8080";
  }

  return publicBaseUrl ?? "/soj-api";
}

export function buildQuery(params: Record<string, QueryValue | QueryValue[]> = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || typeof item === "undefined") continue;
      search.append(key, String(item));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.accessToken;
  const managed = typeof token === "function";
  let accessToken = typeof token === "function" ? token() : token;
  let session = managed ? readBrowserSession() : null;
  if (session && Date.parse(session.expiresAt) <= Date.now()) {
    session = await renewBrowserSession(session);
    accessToken = session.accessToken;
  }
  try {
    return await sendRequest<T>(path, { ...options, accessToken });
  } catch (error) {
    if (!session || !(error instanceof ApiError) || error.status !== 401 || path.startsWith("/api/v1/auth/")) throw error;
    const current = readBrowserSession();
    if (!current || current.user.id !== session.user.id) throw error;
    // Another request/tab may already have rotated the rejected token.
    const renewed = current.accessToken !== accessToken ? current : await renewBrowserSession(current);
    try {
      return await sendRequest<T>(path, { ...options, accessToken: renewed.accessToken });
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) clearMatchingSession(renewed);
      throw retryError;
    }
  }
}

async function sendRequest<T>(path: string, options: Omit<RequestOptions, "accessToken"> & { accessToken?: string }): Promise<T> {
  const { accessToken, headers, query, ...init } = options;
  const requestHeaders: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    requestHeaders[key] = value;
  });
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${apiBaseUrl()}${appendQuery(path, query)}`, {
    ...init,
    cache: "no-store",
    ...(Object.keys(requestHeaders).length > 0 ? { headers: requestHeaders } : {}),
  });

  const envelope = await parseEnvelope<T>(response);

  if (!response.ok || envelope.error) {
    throw apiErrorFromBackend(envelope.error, response.status);
  }

  if (!Object.prototype.hasOwnProperty.call(envelope, "data")) {
    throw new ApiError("HTTP API response did not include data.", "api.invalid_response", response.status);
  }

  return envelope.data as T;
}

let renewal: { token: string; promise: Promise<AuthSession> } | null = null;

function renewBrowserSession(session: AuthSession): Promise<AuthSession> {
  if (renewal?.token === session.refreshToken) return renewal.promise;
  const operation = async () => {
    const current = readBrowserSession();
    if (!current || current.user.id !== session.user.id) throw new ApiError("Session changed.", "auth.session_changed", 401);
    if (current.refreshToken !== session.refreshToken) return current;
    try {
      const data = await sendRequest<AuthResponse>("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      const latest = readBrowserSession();
      // A late refresh must never undo logout or overwrite a different login.
      if (!latest || latest.refreshToken !== session.refreshToken) throw new ApiError("Session changed.", "auth.session_changed", 401);
      const renewed = mapAuthSession(data);
      saveSession(window.localStorage, renewed);
      return renewed;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) clearMatchingSession(session);
      throw error;
    }
  };
  // Web Locks serialize refresh-token rotation across tabs when available.
  const promise = (async () => {
    if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request("soj.session.refresh", operation);
    return operation();
  })().finally(() => {
    if (renewal?.promise === promise) renewal = null;
  });
  renewal = { token: session.refreshToken, promise };
  return promise;
}

function clearMatchingSession(session: AuthSession) {
  if (readBrowserSession()?.refreshToken === session.refreshToken) clearSession(window.localStorage);
}

async function parseEnvelope<T>(response: Response): Promise<Envelope<T>> {
  const body = await response.text();
  if (body.length === 0) {
    if (response.ok && (response.status === 202 || response.status === 204)) {
      return { data: undefined as T };
    }

    throw new ApiError("HTTP API response was empty.", "api.invalid_response", response.status);
  }

  try {
    return JSON.parse(body) as Envelope<T>;
  } catch {
    throw new ApiError("HTTP API response was not valid JSON.", "api.invalid_response", response.status);
  }
}

function apiErrorFromBackend(error: BackendError | null | undefined, status: number) {
  return new ApiError(error?.message ?? "HTTP API request failed.", error?.code ?? "api.request_failed", status, parseErrorDetails(error?.details));
}

function parseErrorDetails(details: unknown): ApiErrorDetails | undefined {
  if (!details || typeof details !== "object") return undefined;
  const findings = (details as { findings?: unknown }).findings;
  if (!Array.isArray(findings)) return undefined;
  return { findings: findings.filter(isTestcaseFinding) };
}

function isTestcaseFinding(value: unknown): value is TestcaseFinding {
  if (!value || typeof value !== "object") return false;
  const finding = value as { code?: unknown; message?: unknown };
  return typeof finding.code === "string" && typeof finding.message === "string";
}

function appendQuery(path: string, query?: Record<string, QueryValue | QueryValue[]>) {
  const serialized = buildQuery(query);
  if (!serialized) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${serialized.slice(1)}`;
}
