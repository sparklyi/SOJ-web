"use client";

import type { ReactNode } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
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
 */
export function PermissionGate({ anyOf, override, children }: PermissionGateProps) {
  const { status, can } = useAuth();
  const { t } = useI18n();

  if (status === "loading" || override === "checking") {
    return <GateState title={t("gate.loading")} />;
  }

  if (status === "anonymous") {
    return (
      <GateState
        title={t("gate.signInRequired")}
        body={t("gate.signInBody")}
        action={
          <LocalizedLink
            href="/auth/login"
            className="inline-flex items-center rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 px-4 py-2 text-sm text-soj-text transition hover:bg-soj-accent/20"
          >
            {t("gate.signIn")}
          </LocalizedLink>
        }
      />
    );
  }

  if (override !== "granted" && !anyOf.some((permission) => can(permission))) {
    return (
      <GateState
        title={t("gate.deniedTitle")}
        body={t("gate.deniedBody")}
        action={
          <LocalizedLink
            href="/"
            className="inline-flex items-center rounded-soj-md border border-soj-line px-4 py-2 text-sm text-soj-muted transition hover:border-soj-accent/40 hover:text-soj-text"
          >
            {t("gate.goHome")}
          </LocalizedLink>
        }
      />
    );
  }

  return <>{children}</>;
}

function GateState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/60 px-6 py-10 text-center">
      <p className="text-base font-medium text-soj-text">{title}</p>
      {body ? <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-soj-muted">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function roleMessageKey(role: string): MessageKey {
  return `role.${role}` as MessageKey;
}

export function rejudgeStatusMessageKey(status: string): MessageKey {
  return `rejudgeStatus.${status}` as MessageKey;
}
