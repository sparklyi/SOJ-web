import { isContestRole, permissions, type Permission, type Role } from "@/lib/auth/permissions";
import type { PermissionCatalogEntry, PermissionScope } from "@/lib/api/types";

/**
 * Mock-only role→permission mapping and permission directory metadata.
 *
 * The running app answers `can()` from the server-issued `user.permissions`
 * list and reads the directory from `GET /admin/roles`, so this table exists
 * solely to build fixture sessions and to let the mock adapter exercise the
 * same authorization decisions as the backend. Nothing outside `lib/mock` and
 * the tests may import it.
 */
const rolePermissions: Record<Role, readonly Permission[]> = {
  user: [],
  author: ["problem.create", "problem.edit_own", "problem.submit_review"],
  reviewer: ["problem.review", "problem.publish"],
  operator: ["submission.rejudge", "judge.inspect"],
  admin: permissions,
  root: permissions,
  contest_staff: ["contest.read"],
  contest_manager: ["contest.read", "contest.manage"],
  contest_judge: ["contest.read", "contest.judge"],
};

export function permissionsForRoles(...userRoles: Role[]): Permission[] {
  return permissions.filter((permission) => userRoles.some((role) => rolePermissions[role].includes(permission)));
}

/** The default permission set of one role, in directory order. */
export function permissionsForRole(role: Role): Permission[] {
  return [...rolePermissions[role]];
}

/** admin/root always hold the whole directory and are not editable in the matrix. */
export const lockedRoles: readonly Role[] = ["admin", "root"];

/**
 * The full-access-only permissions. Mirrors the backend
 * `nonDelegablePermissions` set: the phase-2 matrix must not hand them to a
 * scoped role.
 */
const nonDelegablePermissions: readonly Permission[] = [
  "audit.read",
  "role.grant",
  "role.permission.manage",
  "role.revoke",
  "system.manage",
  "user.manage",
];

/** The production gate that actually reads each permission, mirroring the backend `Catalog()`. */
const permissionConsumers: Record<Permission, string> = {
  "audit.read": "audit.Service.ListEvents",
  "contest.create": "contest.requireContestCreator",
  "contest.judge": "contest.AuthorizeContestRejudge",
  "contest.manage": "contest.canManageContest",
  "contest.manage_all": "contest.requireContestCreator/canManageAllContests",
  "contest.read": "contest.ContestReader",
  "judge.inspect": "submission.SubmissionReader (任意提交/diagnostics) + submission.RunService.GetRun",
  "problem.create": "problem.RBACProblemPolicy.CanCreate",
  "problem.edit_own": "problem.RBACProblemPolicy.CanEdit",
  "problem.manage_all": "problem.RBACProblemPolicy (bypass) + problem.canReadProblem",
  "problem.publish": "problem.RBACProblemPolicy.CanDecideReview",
  "problem.review": "problem.RBACProblemPolicy.CanViewReviewQueue/CanDecideReview/CanViewReviewEvents",
  "problem.submit_review": "problem.RBACProblemPolicy.CanSubmitReview",
  "role.grant": "user.Service.GrantRole",
  "role.permission.manage": "user.RolePermissionService.Matrix/Replace",
  "role.revoke": "user.Service.RevokeRole",
  "submission.rejudge": "problem.RBACProblemPolicy.CanRejudge + submission.RejudgeService",
  "system.manage": "submission.LanguageService (语言管理)",
  "user.manage": "user.Service.ListUsers/ListUsersByCursor/UpdateUser",
};

/**
 * Mirrors the backend rule: only contest.read/manage/judge are contest scoped.
 * contest.create and contest.manage_all are global capabilities (no single
 * contest context), so global roles may hold them.
 */
const contestScopedPermissions: readonly Permission[] = ["contest.read", "contest.manage", "contest.judge"];

export function permissionScope(code: Permission): PermissionScope {
  return contestScopedPermissions.includes(code) ? "contest" : "global";
}

export function roleScope(role: Role): PermissionScope {
  return isContestRole(role) ? "contest" : "global";
}

/** The permission directory as served by `GET /admin/roles`, in catalog order. */
export function permissionCatalog(): PermissionCatalogEntry[] {
  return permissions.map((code) => ({
    code,
    scope: permissionScope(code),
    delegable: !nonDelegablePermissions.includes(code),
    consumer: permissionConsumers[code],
  }));
}
