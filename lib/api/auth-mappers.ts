import type { AuthResponse, UserResponse } from "./backend-types";
import type { CurrentUser } from "./types";
import type { AuthSession } from "@/lib/auth/session";

export function mapUser(input: UserResponse): CurrentUser {
  return { id: input.id, handle: input.username, displayName: input.username, roles: input.roles, permissions: input.permissions };
}

export function mapAuthSession(input: AuthResponse, now: Date = new Date()): AuthSession {
  return {
    accessToken: input.access_token,
    refreshToken: input.refresh_token,
    user: mapUser(input.user),
    expiresAt: new Date(now.getTime() + input.expires_in * 1000).toISOString(),
  };
}
