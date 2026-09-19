"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createBrowserApiClient } from "@/lib/api/client";
import type { ContestRole } from "@/lib/auth/permissions";

export type ContestAccessState = "checking" | "granted" | "denied";

export type ContestAccess = {
  state: ContestAccessState;
  roles: ContestRole[];
  ownerUserId: number | null;
};

type ScopedFacts = {
  ownerUserId: number | null;
  roles: ContestRole[];
};

const unresolved: ContestAccess = { state: "checking", roles: [], ownerUserId: null };
const denied: ContestAccess = { state: "denied", roles: [], ownerUserId: null };
const granted: ContestAccess = { state: "granted", roles: [], ownerUserId: null };

/**
 * Reads the caller's per-contest authorization facts from the contest payload.
 *
 * Contest roles are never part of the global permission set. The backend grants
 * them through `/contests/{id}/roles`, rejects them on the global role endpoint
 * with `role.invalid_role`, and only exposes a caller's own assignments per
 * contest through `current_user_roles` (after `actorWithContestRoles`). A
 * capability derived from one of those roles therefore cannot be answered by
 * `can(...)` and needs this round trip. The single exception is admin/root:
 * `contest.manage_all` already sits in their session permission list, so they
 * skip the lookup entirely.
 *
 * Only the network lookup runs in an effect. The other outcomes are derived
 * during render, so a viewer never sees a flash of the wrong state.
 */
function useScopedFacts(contestId: number) {
  const { status, user, can } = useAuth();
  const [lookup, setLookup] = useState<{ key: string; facts: ScopedFacts } | null>(null);

  const isAuthenticated = status === "authenticated" && user !== null;
  const isFullAccess = can("contest.manage_all");
  const lookupKey = user ? `${contestId}:${user.id}` : "";

  useEffect(() => {
    if (!isAuthenticated || isFullAccess || !user) return;

    let cancelled = false;
    const key = `${contestId}:${user.id}`;

    createBrowserApiClient()
      .contests.get(contestId)
      .then((contest) => {
        if (cancelled) return;
        setLookup({ key, facts: { ownerUserId: contest.ownerUserId, roles: contest.currentUserRoles } });
      })
      .catch(() => {
        if (!cancelled) setLookup({ key, facts: { ownerUserId: null, roles: [] } });
      });

    return () => {
      cancelled = true;
    };
  }, [contestId, isAuthenticated, isFullAccess, user]);

  return { status, isAuthenticated, isFullAccess, userId: user?.id ?? null, facts: lookup && lookup.key === lookupKey ? lookup.facts : null };
}

function decide(
  status: "loading" | "authenticated" | "anonymous",
  isAuthenticated: boolean,
  isFullAccess: boolean,
  userId: number | null,
  facts: ScopedFacts | null,
  accepted: readonly ContestRole[],
): ContestAccess {
  if (status === "loading") return unresolved;
  if (!isAuthenticated) return denied;
  if (isFullAccess) return granted;
  if (facts === null) return unresolved;

  // Mirrors `canManageContest` on the backend: admin/root, the contest owner, or
  // the matching permission contributed by a scoped role.
  const isOwner = userId !== null && facts.ownerUserId === userId;
  const holdsAcceptedRole = facts.roles.some((role) => accepted.includes(role));
  const outcome: ContestAccess = { state: "granted", roles: facts.roles, ownerUserId: facts.ownerUserId };
  return isOwner || holdsAcceptedRole ? outcome : { ...denied, roles: facts.roles, ownerUserId: facts.ownerUserId };
}

/**
 * `requireContestManager`: may administer that contest's role assignments.
 */
export function useContestRoleAccess(contestId: number): ContestAccess {
  const { status, isAuthenticated, isFullAccess, userId, facts } = useScopedFacts(contestId);
  return decide(status, isAuthenticated, isFullAccess, userId, facts, ["contest_manager"]);
}

/**
 * `requireContestJudge`: may rejudge that contest and read its results.
 */
export function useContestJudgeAccess(contestId: number): ContestAccess {
  const { status, isAuthenticated, isFullAccess, userId, facts } = useScopedFacts(contestId);
  return decide(status, isAuthenticated, isFullAccess, userId, facts, ["contest_manager", "contest_judge"]);
}
