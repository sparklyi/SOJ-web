"use client";

import type { ReactNode } from "react";
import { AuthWall } from "@/components/auth/auth-wall";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Permission } from "@/lib/auth/permissions";
import type { MessageKey } from "@/lib/i18n/messages";

/**
 * Capability helpers for a signed-in session. `can` only reads the permission
 * list the backend resolved for the current user; contest-scoped roles are read
 * from `ContestSummary.currentUserRoles` instead, because they do not appear in
 * the global permission set.
 */
export function usePermissions() {
  const { status, user, can } = useAuth();

  return {
    status,
    user,
    can,
    canAny: (permissions: readonly Permission[]) => permissions.some((permission) => can(permission)),
    canAll: (permissions: readonly Permission[]) => permissions.every((permission) => can(permission)),
  };
}

type PermissionGateProps = {
  anyOf: readonly Permission[];
  /**
   * Outcome of an additional check that the global permission set cannot
   * express (for example a contest-scoped role). `"granted"` opens the surface
   * regardless of `anyOf`; `"checking"` shows the loading state instead of a
   * premature denial while the extra check is in flight.
   */
  override?: "checking" | "granted" | "denied";
  children: ReactNode;
};

/**
 * Blocks a surface until the session holds at least one of `anyOf`. It is the
 * route-level counterpart of hiding a navigation entry: an unauthenticated or
 * under-privileged visitor who types the URL directly sees an explicit state
 * instead of a page that will fail every request behind it.
 *
 * 三种状态一律落到共享的 `AuthWall`：这里此前自己捏了一个 `GateState`，
 * 而管理后台另捏了一个左对齐横条，于是同一个产品里出现了两种登录墙。
 */
export function PermissionGate({ anyOf, override, children }: PermissionGateProps) {
  const { status, can } = useAuth();
  const { t } = useI18n();

  if (status === "loading" || override === "checking") {
    return <AuthWall title={t("gate.loading")} />;
  }

  if (status === "anonymous") {
    return <AuthWall title={t("gate.signInRequired")} body={t("gate.signInBody")} actionHref="/auth/login" actionLabel={t("gate.signIn")} />;
  }

  if (override !== "granted" && !anyOf.some((permission) => can(permission))) {
    return <AuthWall title={t("gate.deniedTitle")} body={t("gate.deniedBody")} actionHref="/" actionLabel={t("gate.goHome")} />;
  }

  return <>{children}</>;
}

export function roleMessageKey(role: string): MessageKey {
  return `role.${role}` as MessageKey;
}

export function rejudgeStatusMessageKey(status: string): MessageKey {
  return `rejudgeStatus.${status}` as MessageKey;
}
