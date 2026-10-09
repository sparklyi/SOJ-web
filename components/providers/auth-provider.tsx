"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getApiMode } from "@/lib/api/mode";
import type { Permission } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/api/types";
import { clearSession, readBrowserSession, restoreSession, sessionChangeEvent, sessionKey, type AuthSession } from "@/lib/auth/session";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthState = {
  status: AuthStatus;
  user: CurrentUser | null;
  session: AuthSession | null;
};

type AuthContextValue = AuthState & {
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const anonymousState: AuthState = {
  status: "anonymous",
  user: null,
  session: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, session: null });
  const mountedRef = useRef(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    const requestId = ++requestRef.current;

    let candidate: AuthSession | null = null;
    try {
      candidate = getApiMode() === "http" ? readBrowserSession() : restoreSession(window.localStorage);
    } catch {
      candidate = null;
    }

    if (!candidate) {
      if (getApiMode() === "mock" && readBrowserSession()) clearSession(window.localStorage);
      if (mountedRef.current && requestId === requestRef.current) setState(anonymousState);
      return;
    }

    // Renewing the same account must keep authenticated workspaces mounted,
    // otherwise a routine token rotation can discard an unsaved editor draft.
    const candidateUserID = candidate.user.id;
    setState((current) => current.status === "authenticated" && current.user?.id === candidateUserID
      ? current
      : { status: "loading", user: null, session: null });

    try {
      const user = await createBrowserApiClient().auth.me();
      if (!mountedRef.current || requestId !== requestRef.current) return;

      if (!user) {
        clearSession(window.localStorage);
        setState(anonymousState);
        return;
      }

      const current = readBrowserSession();
      if (!current || current.user.id !== candidate.user.id) return;
      setState({ status: "authenticated", user, session: { ...current, user } });
    } catch (error) {
      // Do not expose a locally restored candidate until the server validates it.
      if (requestId === requestRef.current && readBrowserSession()?.refreshToken === candidate.refreshToken && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearSession(window.localStorage);
      }
      if (mountedRef.current && requestId === requestRef.current) setState(anonymousState);
    }
  }, []);

  const logout = useCallback(async () => {
    const session = state.session;
    try {
      if (session) {
        await createBrowserApiClient({ accessToken: session.accessToken }).auth.logout({ refreshToken: session.refreshToken });
      }
    } finally {
      clearSession(window.localStorage);
      setState(anonymousState);
    }
  }, [state.session]);

  const can = useCallback((permission: Permission) => state.user?.permissions.includes(permission) ?? false, [state.user]);

  useEffect(() => {
    if (!state.session || getApiMode() !== "http") return;
    const timer = window.setTimeout(() => void refresh(), Math.max(0, Math.min(Date.parse(state.session.expiresAt) - Date.now(), 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [state.session, refresh]);

  useEffect(() => {
    mountedRef.current = true;

    function handleStorage(event: StorageEvent) {
      if (event.storageArea === window.localStorage && (event.key === sessionKey || event.key === null)) {
        void refresh();
      }
    }

    window.addEventListener(sessionChangeEvent, refresh);
    window.addEventListener("storage", handleStorage);
    queueMicrotask(() => void refresh());

    return () => {
      mountedRef.current = false;
      window.removeEventListener(sessionChangeEvent, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return <AuthContext.Provider value={{ ...state, can, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
