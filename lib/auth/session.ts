import type { CurrentUser } from "@/lib/api/types";

export type AuthSession = {
  token: string;
  user: CurrentUser;
  expiresAt: string;
};

export type SessionStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export const sessionKey = "soj.session";

export function restoreSession(store: SessionStore, now: Date = new Date()) {
  const value = store.getItem(sessionKey);
  if (!value) return null;

  try {
    const session = JSON.parse(value) as AuthSession;
    if (!session.token || !session.user || Date.parse(session.expiresAt) <= now.getTime()) {
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
}

export function clearSession(store: SessionStore) {
  store.removeItem(sessionKey);
}

export function createMockSession(user: CurrentUser, now: Date = new Date()): AuthSession {
  return {
    token: `mock-${user.id}-${now.getTime()}`,
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
