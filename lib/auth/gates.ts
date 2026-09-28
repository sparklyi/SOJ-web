import type { Permission } from "./permissions";

/**
 * Combo gates mirrored one-for-one from the backend `internal/authz/Combos()`.
 * The names and the permission sets here must stay in lockstep with Go; each
 * repository pins them with its own tests.
 *
 * Each entry is a UNION: it is the set of permissions that may open the
 * surface, used by the catalog validation test. A surface whose backend rule is
 * a conjunction gets a dedicated predicate below rather than being read
 * straight out of this table.
 */
export const gatePermissions = {
  "problem.authoring.access": ["problem.create", "problem.review", "problem.manage_all"],
  "problem.review.queue": ["problem.review", "problem.manage_all"],
  "problem.review.decide": ["problem.review", "problem.publish", "problem.manage_all"],
} as const satisfies Record<string, readonly Permission[]>;

export function canAccessAuthoring(can: (permission: Permission) => boolean): boolean {
  return gatePermissions["problem.authoring.access"].some((permission) => can(permission));
}

export function canViewReviewQueue(can: (permission: Permission) => boolean): boolean {
  return gatePermissions["problem.review.queue"].some((permission) => can(permission));
}

/**
 * `problem.review.decide` is a conjunction on the backend: `manage_all`, or
 * `review` together with `publish`. Holding only `review` may open the queue but
 * must not expose a clickable decision.
 */
export function canDecideReview(can: (permission: Permission) => boolean): boolean {
  return can("problem.manage_all") || (can("problem.review") && can("problem.publish"));
}
