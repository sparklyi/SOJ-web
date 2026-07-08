import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { request } from "@/lib/api/http-client";

describe("http adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from a successful backend envelope through languages.list", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          items: [
            {
              id: 60,
              engine: "soj-agent",
              engine_language_id: "go",
              name: "Go",
              version: "1.24",
              compile_command: "go build -o {{binary}} {{source}}",
              run_command: "{{binary}}",
              default_time_limit_ms: 1000,
              default_memory_limit_kb: 262144,
              enabled: true,
            },
          ],
          total: 1,
          page: 1,
          page_size: 100,
        },
        error: null,
        request_id: "req-test",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const languages = await createHttpAdapter().languages.list({ enabled: true, engine: "soj-agent" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/admin/languages?page=1&page_size=100&enabled=true&engine=soj-agent",
      { cache: "no-store" },
    );
    expect(languages).toEqual({
      items: [
        {
          id: 60,
          engine: "soj-agent",
          engineLanguageId: "go",
          name: "Go",
          version: "1.24",
          compileCommand: "go build -o {{binary}} {{source}}",
          runCommand: "{{binary}}",
          defaultTimeLimitMs: 1000,
          defaultMemoryLimitKb: 262144,
          enabled: true,
        },
      ],
      total: 1,
    });
  });

  it("throws ApiError with backend error code, message, and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            data: null,
            error: { code: "auth.forbidden", message: "Admin access is required." },
          },
          { status: 403 },
        ),
      ),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "auth.forbidden",
      message: "Admin access is required.",
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("throws ApiError when a successful backend envelope is missing data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          error: null,
        }),
      ),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "api.invalid_response",
      status: 200,
    } satisfies Partial<ApiError>);
  });

  it("throws ApiError when the backend returns non-JSON content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("service unavailable", { status: 503, headers: { "content-type": "text/plain" } })),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "api.invalid_response",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("allows callers to receive undefined from an empty successful response", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request<undefined>("/api/v1/auth/logout")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/logout", { cache: "no-store" });
  });

  it("adds a bearer authorization header when an access token is provided", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 100,
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createHttpAdapter({ accessToken: "test-token" }).languages.list();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/admin/languages?page=1&page_size=100", {
      cache: "no-store",
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("logs in and maps backend username to current user identity", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: authResponse({ id: 7, username: "ada" }),
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const session = await createHttpAdapter().auth.login({ email: "ada@example.com", password: "secret" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/login", {
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ada@example.com", password: "secret" }),
    });
    expect(session).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: 7, handle: "ada", displayName: "ada", role: "user" },
    });
    expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
  });

  it("registers and maps backend username to current user identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: authResponse({ id: 8, username: "grace" }),
          error: null,
        }),
      ),
    );

    const session = await createHttpAdapter().auth.register({
      email: "grace@example.com",
      username: "grace",
      password: "secret",
    });

    expect(session.user).toEqual({ id: 8, handle: "grace", displayName: "grace", role: "user" });
  });

  it("refreshes a session with the supplied refresh token", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: authResponse({ id: 9, username: "alan" }),
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const session = await createHttpAdapter().auth.refresh({ refreshToken: "old-refresh" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/refresh", {
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: "old-refresh" }),
    });
    expect(session.refreshToken).toBe("refresh-token");
    expect(session.user.handle).toBe("alan");
  });

  it("loads the current user from /me", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: userResponse({ id: 10, username: "lin" }),
          error: null,
        }),
      ),
    );

    await expect(createHttpAdapter({ accessToken: "access-token" }).auth.me()).resolves.toEqual({
      id: 10,
      handle: "lin",
      displayName: "lin",
      role: "user",
    });
  });

  it("returns null when /me responds with 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            data: null,
            error: { code: "auth.unauthorized", message: "Unauthorized." },
          },
          { status: 401 },
        ),
      ),
    );

    await expect(createHttpAdapter({ accessToken: "expired" }).auth.me()).resolves.toBeNull();
  });

  it("logs out with an empty 204 success response", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createHttpAdapter({ accessToken: "access-token" }).auth.logout({ refreshToken: "refresh-token" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/logout", {
      cache: "no-store",
      method: "POST",
      headers: { Authorization: "Bearer access-token", "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: "refresh-token" }),
    });
  });
});

function authResponse(overrides: { id: number; username: string }) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    user: userResponse(overrides),
  };
}

function userResponse(overrides: { id: number; username: string }) {
  return {
    id: overrides.id,
    email: `${overrides.username}@example.com`,
    username: overrides.username,
    avatar_url: null,
    bio: null,
    role: "user",
    status: "active",
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-07T10:00:00Z",
  };
}
