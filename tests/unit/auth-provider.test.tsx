import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { clearSession, createMockSession, saveSession } from "@/lib/auth/session";
import { mockAuthorUser, mockUser } from "@/lib/mock/fixtures";

function AuthProbe() {
  const { status, user, can } = useAuth();
  return (
    <>
      <output data-testid="auth-state">{`${status}:${user?.handle ?? "anonymous"}`}</output>
      <output data-testid="problem-create-capability">{String(can("problem.create"))}</output>
    </>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe("browser auth provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("stays anonymous in HTTP mode without a saved session", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "http");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:anonymous"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates a saved HTTP session before exposing the user", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "http");
    const session = createMockSession(mockUser);
    saveSession(window.localStorage, session);
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          id: mockUser.id,
          email: "lin@example.com",
          username: mockUser.handle,
          avatar_url: null,
          bio: null,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
          status: "active",
          created_at: "2026-07-07T10:00:00Z",
          updated_at: "2026-07-07T10:00:00Z",
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:lin-chen"));
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/me", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  });

  it("clears a session rejected by /me", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "http");
    saveSession(window.localStorage, createMockSession(mockUser));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: null, error: { code: "auth.unauthorized", message: "Unauthorized." } }, { status: 401 })),
    );

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:anonymous"));
    expect(window.localStorage.getItem("soj.session")).toBeNull();
  });

  it("refreshes after login and logout storage events", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "http");
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          id: mockUser.id,
          email: "lin@example.com",
          username: mockUser.handle,
          avatar_url: null,
          bio: null,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
          status: "active",
          created_at: "2026-07-07T10:00:00Z",
          updated_at: "2026-07-07T10:00:00Z",
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:anonymous"));

    saveSession(window.localStorage, createMockSession(mockUser));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:lin-chen"));

    clearSession(window.localStorage);
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:anonymous"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps explicit mock mode anonymous until a session exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "mock");

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous:anonymous"));

    saveSession(window.localStorage, createMockSession(mockUser));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:lin-chen"));
    expect(screen.getByTestId("problem-create-capability")).toHaveTextContent("false");
  });

  it("exposes permissions from the validated session through can", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "mock");
    saveSession(window.localStorage, createMockSession(mockAuthorUser));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("authenticated:lin-chen"));
    expect(screen.getByTestId("problem-create-capability")).toHaveTextContent("true");
  });
});
