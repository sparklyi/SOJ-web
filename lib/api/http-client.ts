import { ApiError } from "./errors";
import type { BackendError, Envelope } from "./backend-types";

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = Omit<RequestInit, "cache"> & {
  accessToken?: string;
  query?: Record<string, QueryValue | QueryValue[]>;
};

export function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_SOJ_API_BASE_URL ?? "http://localhost:8080";
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
  const { accessToken, headers, query, ...init } = options;
  const requestHeaders: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    requestHeaders[key] = value;
  });
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${apiBaseUrl()}${path}${buildQuery(query)}`, {
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

async function parseEnvelope<T>(response: Response): Promise<Envelope<T>> {
  try {
    return (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError("HTTP API response was not valid JSON.", "api.invalid_response", response.status);
  }
}

function apiErrorFromBackend(error: BackendError | null | undefined, status: number) {
  return new ApiError(error?.message ?? "HTTP API request failed.", error?.code ?? "api.request_failed", status);
}
