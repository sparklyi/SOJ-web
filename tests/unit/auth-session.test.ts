import { describe, expect, it } from "vitest";
import { clearSession, createMemorySessionStore, createMockSession, restoreSession, saveSession } from "@/lib/auth/session";
import { mockUser } from "@/lib/mock/fixtures";

describe("auth session boundary", () => {
  it("restores a saved session", () => {
    const now = new Date("2026-07-07T10:00:00Z");
    const session = createMockSession(mockUser, now);
    const store = createMemorySessionStore();

    saveSession(store, session);

    expect(restoreSession(store, now)).toMatchObject({ user: { handle: "lin-chen" } });
  });

  it("returns anonymous state when no session exists", () => {
    expect(restoreSession(createMemorySessionStore())).toBeNull();
  });

  it("clears expired or invalid sessions", () => {
    const now = new Date("2026-07-07T10:00:00Z");
    const session = createMockSession(mockUser, new Date("2026-07-06T10:00:00Z"));
    const store = createMemorySessionStore(session);

    expect(restoreSession(store, now)).toBeNull();
    expect(store.getItem("soj.session")).toBeNull();
  });

  it("clears session on logout", () => {
    const session = createMockSession(mockUser);
    const store = createMemorySessionStore(session);

    clearSession(store);

    expect(restoreSession(store)).toBeNull();
  });
});
