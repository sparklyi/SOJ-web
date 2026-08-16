"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Permission } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/api/types";
import { clearSession, restoreSession, sessionChangeEvent, sessionKey, type AuthSession } from "@/lib/auth/session";

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
    setState({ status: "loading", user: null, session: null });

    let candidate: AuthSession | null = null;
    try {
      candidate = restoreSession(window.localStorage);
    } catch {
      candidate = null;
    }

    if (!candidate) {
      if (mountedRef.current && requestId === requestRef.current) setState(anonymousState);
      return;
    }

    try {
      const user = await createBrowserApiClient({ accessToken: candidate.accessToken }).auth.me();
      if (!mountedRef.current || requestId !== requestRef.current) return;

      if (!user) {
        clearSession(window.localStorage);
        setState(anonymousState);
        return;
      }

      setState({ status: "authenticated", user, session: { ...candidate, user } });
    } catch (error) {
      // Do not expose a locally restored candidate until the server validates it.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
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
