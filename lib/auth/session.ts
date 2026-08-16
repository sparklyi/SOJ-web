import type { CurrentUser } from "@/lib/api/types";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
  expiresAt: string;
};

export type SessionStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export const sessionKey = "soj.session";
export const sessionChangeEvent = "soj:session-change";

export function restoreSession(store: SessionStore, now: Date = new Date()) {
  const value = store.getItem(sessionKey);
  if (!value) return null;

  try {
    const session: unknown = JSON.parse(value);
    if (!isAuthSession(session, now)) {
      clearSession(store);
      return null;
    }
    return session;
  } catch {
    clearSession(store);
    return null;
  }
}

export function saveSession(store: SessionStore, session: AuthSession) {
  store.setItem(sessionKey, JSON.stringify(session));
  notifyBrowserSessionChange(store);
}

export function clearSession(store: SessionStore) {
  store.removeItem(sessionKey);
  notifyBrowserSessionChange(store);
}

export function createMockSession(user: CurrentUser, now: Date = new Date()): AuthSession {
  return {
    accessToken: `mock-access-${user.id}-${now.getTime()}`,
    refreshToken: `mock-refresh-${user.id}-${now.getTime()}`,
    user,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 12).toISOString(),
  };
}

export function createMemorySessionStore(initial?: AuthSession): SessionStore {
  const values = new Map<string, string>();
  if (initial) values.set(sessionKey, JSON.stringify(initial));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function isAuthSession(value: unknown, now: Date): value is AuthSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.refreshToken === "string" &&
    session.refreshToken.length > 0 &&
    isCurrentUser(session.user) &&
    typeof session.expiresAt === "string" &&
    Number.isFinite(Date.parse(session.expiresAt)) &&
    Date.parse(session.expiresAt) > now.getTime()
  );
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") return false;

  const user = value as Partial<CurrentUser>;
  return (
    typeof user.id === "number" &&
    Number.isFinite(user.id) &&
    user.id > 0 &&
    typeof user.handle === "string" &&
    user.handle.length > 0 &&
    typeof user.displayName === "string" &&
    user.displayName.length > 0 &&
    (user.role === "user" || user.role === "admin" || user.role === "root")
  );
}

function notifyBrowserSessionChange(store: SessionStore) {
  if (typeof window === "undefined") return;

  try {
    if (store === window.localStorage) {
      window.dispatchEvent(new Event(sessionChangeEvent));
    }
  } catch {
    // Storage access can be unavailable in privacy-restricted browser contexts.
  }
}
