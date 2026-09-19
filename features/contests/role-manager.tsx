"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PermissionGate, roleMessageKey } from "@/components/auth/permission-gate";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserApiClient } from "@/lib/api/client";
import type { ContestRoleAssignment } from "@/lib/api/types";
import { useContestRoleAccess } from "@/lib/auth/contest-access";
import { contestRoles, type ContestRole } from "@/lib/auth/permissions";
import { grantContestRole, listContestRoles, revokeContestRole } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; assignments: ContestRoleAssignment[] };

export function ContestRoleManager({ contestId }: { contestId: number }) {
  const { t } = useI18n();
  const access = useContestRoleAccess(contestId);

  return (
    <PageShell title={`${t("roles.contestTitle")} · #${contestId}`} description={t("roles.contestDescription")}>
      <PermissionGate anyOf={["contest.manage_all"]} override={access.state}>
        <ContestRoleBoard contestId={contestId} />
      </PermissionGate>
    </PageShell>
  );
}

function ContestRoleBoard({ contestId }: { contestId: number }) {
  const { t } = useI18n();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ContestRole>("contest_staff");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const assignments = await listContestRoles(contestId, createBrowserApiClient());
      setState({ status: "ready", assignments });
    } catch (cause) {
      setState({ status: "error", message: cause instanceof Error ? cause.message : t("roles.failed") });
    }
  }, [contestId, t]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const assignments = await listContestRoles(contestId, createBrowserApiClient());
        if (active) setState({ status: "ready", assignments });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("roles.failed") });
      }
    }

    void start();

    return () => {
      active = false;
    };
  }, [contestId, t]);

  async function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number.parseInt(userId, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFeedback({ tone: "danger", message: t("roles.needUser") });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("roles.needReason") });
      return;
    }
    setPending(`grant-${parsed}-${role}`);
    setFeedback(null);
    try {
      await grantContestRole(contestId, { userId: parsed, role, reason: reason.trim() }, createBrowserApiClient());
      setUserId("");
      setReason("");
      setFeedback({ tone: "success", message: t("roles.granted") });
      await loadAssignments();
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.failed") });
    } finally {
      setPending(null);
    }
  }

  async function handleRevoke(assignment: ContestRoleAssignment) {
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("roles.needReason") });
      return;
    }
    setPending(`revoke-${assignment.id}`);
    setFeedback(null);
    try {
      await revokeContestRole(
        contestId,
        { userId: assignment.userId, role: assignment.role, reason: reason.trim() },
        createBrowserApiClient(),
      );
      setReason("");
      setFeedback({ tone: "success", message: t("roles.revoked") });
      await loadAssignments();
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.failed") });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleGrant} className="grid gap-4 rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,160px)_minmax(0,200px)_minmax(0,1fr)] sm:items-end">
          <Input
            name="contest-role-user"
            label={t("roles.userId")}
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            inputMode="numeric"
          />
          <label className="grid gap-2 text-sm text-soj-text">
            {t("roles.role")}
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as ContestRole)}
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm text-soj-text focus:border-soj-accent focus:outline-none focus:ring-1 focus:ring-soj-accent"
            >
              {contestRoles.map((item) => (
                <option key={item} value={item}>
                  {t(roleMessageKey(item))}
                </option>
              ))}
            </select>
          </label>
          <Input
            name="contest-role-reason"
            label={t("roles.reasonPlaceholder")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={pending?.startsWith("grant-") ?? false}>
            {t("roles.grant")}
          </Button>
          {feedback ? (
            <span className={feedback.tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-success"}>{feedback.message}</span>
          ) : null}
        </div>
      </form>

      <section className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
        <h2 className="mb-3 text-sm font-medium text-soj-text">{t("roles.assignments")}</h2>
        {state.status === "loading" ? <p className="text-sm text-soj-muted">{t("status.pending")}</p> : null}
        {state.status === "error" ? <p className="text-sm text-soj-danger">{state.message}</p> : null}
        {state.status === "ready" && state.assignments.length === 0 ? (
          <p className="text-sm text-soj-muted">{t("roles.assignmentsEmpty")}</p>
        ) : null}
        {state.status === "ready" && state.assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-soj-muted">
                  <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("roles.userId")}</th>
                  <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("roles.role")}</th>
                  <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("roles.granted")}</th>
                  <th className="border-b border-soj-line/70 py-2 font-normal">{t("roles.revoke")}</th>
                </tr>
              </thead>
              <tbody>
                {state.assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="border-b border-soj-line/40 py-2 pr-4">
                      <span className="font-mono text-soj-text">#{assignment.userId}</span>
                      {assignment.username ? <span className="ml-2 text-soj-muted">{assignment.username}</span> : null}
                    </td>
                    <td className="border-b border-soj-line/40 py-2 pr-4">
                      <StatusPill tone="accent">{t(roleMessageKey(assignment.role))}</StatusPill>
                    </td>
                    <td className="border-b border-soj-line/40 py-2 pr-4 font-mono text-xs text-soj-muted">
                      {formatTimestamp(assignment.grantedAt)}
                    </td>
                    <td className="border-b border-soj-line/40 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={pending === `revoke-${assignment.id}`}
                        onClick={() => void handleRevoke(assignment)}
                      >
                        {t("roles.revoke")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 16).replace("T", " ") : value;
}
