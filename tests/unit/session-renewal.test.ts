import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/client";
import { request } from "@/lib/api/http-client";
import { clearSession, createMockSession, readBrowserSession, saveSession, sessionKey } from "@/lib/auth/session";
import { mockUser } from "@/lib/mock/fixtures";

beforeEach(() => window.localStorage.clear());
afterEach(() => { window.localStorage.clear(); vi.unstubAllGlobals(); });

const userResponse = { id: mockUser.id, username: mockUser.handle, roles: mockUser.roles, permissions: mockUser.permissions, status: "active" };
const refreshed = { access_token: "new-access", refresh_token: "new-refresh", expires_in: 900, user: userResponse };
const ok = (data: unknown) => Response.json({ data, error: null });
const denied = (status = 401) => Response.json({ data: null, error: { code: "auth.unauthorized", message: "Unauthorized" } }, { status });
const browserToken = () => readBrowserSession()?.accessToken;

function session(expired = false) {
  const saved = createMockSession(mockUser);
  if (expired) saved.expiresAt = new Date(Date.now() - 1000).toISOString();
  saveSession(window.localStorage, saved);
  return saved;
}

describe("browser session renewal", () => {
  it("renews an expired session before its first authenticated request and saves both rotated tokens", async () => {
    const saved = session(true);
    const fetchMock = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/auth/refresh") ? ok(refreshed) : ok(userResponse));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createApiClient({ mode: "http" }).auth.me()).resolves.toMatchObject({ id: mockUser.id });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/v1/auth/refresh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: saved.refreshToken }), cache: "no-store" });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/me", { cache: "no-store", headers: { Authorization: "Bearer new-access" } });
    expect(readBrowserSession()).toMatchObject({ accessToken: "new-access", refreshToken: "new-refresh" });
  });

  it("reuses a rotated token in an already-created API client", async () => {
    session(true);
    const client = createApiClient({ mode: "http" });
    const fetchMock = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/auth/refresh") ? ok(refreshed) : ok(userResponse));
    vi.stubGlobal("fetch", fetchMock);
    await client.auth.me();
    await client.auth.me();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8080/api/v1/me", { cache: "no-store", headers: { Authorization: "Bearer new-access" } });
  });

  it("shares a single refresh among simultaneous expired-session requests", async () => {
    session(true);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith("/auth/refresh")) { await gate; return ok(refreshed); }
      return ok("done");
    });
    vi.stubGlobal("fetch", fetchMock);
    const requests = [request("/api/v1/a", { accessToken: browserToken }), request("/api/v1/b", { accessToken: browserToken })];
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release();
    await expect(Promise.all(requests)).resolves.toEqual(["done", "done"]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"))).toHaveLength(1);
  });

  it("retries a rejected access token once with the same request body and headers", async () => {
    const saved = session();
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/auth/refresh")) return ok(refreshed);
      return new Headers(init?.headers).get("Authorization") === `Bearer ${saved.accessToken}` ? denied() : ok("created");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/api/v1/submissions", { accessToken: browserToken, method: "POST", headers: { "content-type": "application/json", "X-Request-ID": "same-request" }, body: '{"source_code":"hello"}' })).resolves.toBe("created");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8080/api/v1/submissions", { method: "POST", headers: { "content-type": "application/json", "x-request-id": "same-request", Authorization: "Bearer new-access" }, body: '{"source_code":"hello"}', cache: "no-store" });
  });

  it("does not rotate again when another request already refreshed a rejected token", async () => {
    session();
    const fetchMock = vi.fn(async () => {
      saveSession(window.localStorage, { ...createMockSession(mockUser), accessToken: "new-access", refreshToken: "new-refresh" });
      return denied();
    });
    fetchMock.mockImplementationOnce(async () => {
      saveSession(window.localStorage, { ...createMockSession(mockUser), accessToken: "new-access", refreshToken: "new-refresh" });
      return denied();
    });
    fetchMock.mockImplementationOnce(async () => ok("done"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/api/v1/a", { accessToken: browserToken })).resolves.toBe("done");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops after a second 401 and clears the rejected session", async () => {
    session();
    const fetchMock = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/auth/refresh") ? ok(refreshed) : denied());
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(readBrowserSession()).toBeNull();
  });

  it.each([401, 403])("clears a refresh credential rejected with %i", async (status) => {
    session(true);
    vi.stubGlobal("fetch", vi.fn(async () => denied(status)));
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toMatchObject({ status });
    expect(window.localStorage.getItem(sessionKey)).toBeNull();
  });

  it.each([503, 429])("preserves the refresh credential after a temporary %i", async (status) => {
    const saved = session(true);
    vi.stubGlobal("fetch", vi.fn(async () => denied(status)));
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toMatchObject({ status });
    expect(readBrowserSession()?.refreshToken).toBe(saved.refreshToken);
  });

  it("preserves the refresh credential after a network failure", async () => {
    const saved = session(true);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toThrow("offline");
    expect(readBrowserSession()?.refreshToken).toBe(saved.refreshToken);
  });

  it.each(["logout", "different login"])("does not restore the old session after %s during refresh", async (change) => {
    session(true);
    vi.stubGlobal("fetch", vi.fn(async () => {
      if (change === "logout") clearSession(window.localStorage);
      else saveSession(window.localStorage, { ...createMockSession({ ...mockUser, id: 999 }), refreshToken: "other-refresh" });
      return ok(refreshed);
    }));
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toMatchObject({ code: "auth.session_changed" });
    expect(readBrowserSession()?.refreshToken ?? null).toBe(change === "logout" ? null : "other-refresh");
  });

  it("leaves explicit token requests and permission-denied requests outside automatic renewal", async () => {
    session();
    const fetchMock = vi.fn(async () => denied(403));
    vi.stubGlobal("fetch", fetchMock);
    await expect(request("/api/v1/a", { accessToken: browserToken })).rejects.toMatchObject({ status: 403 });
    fetchMock.mockImplementationOnce(async () => denied());
    await expect(request("/api/v1/a", { accessToken: "explicit-token" })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readBrowserSession()).not.toBeNull();
  });

  it("rechecks the stored session after acquiring the cross-tab refresh lock", async () => {
    session(true);
    const locks = { request: vi.fn(async (_name: string, operation: () => Promise<unknown>) => {
      saveSession(window.localStorage, { ...createMockSession(mockUser), accessToken: "tab-access", refreshToken: "tab-refresh" });
      return operation();
    }) };
    vi.stubGlobal("navigator", { locks });
    const fetchMock = vi.fn(async () => ok("done"));
    vi.stubGlobal("fetch", fetchMock);
    await request("/api/v1/a", { accessToken: browserToken });
    expect(locks.request).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/a", { cache: "no-store", headers: { Authorization: "Bearer tab-access" } });
  });
});
