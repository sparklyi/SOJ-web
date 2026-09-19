export const globalRoles = ["user", "author", "reviewer", "operator", "admin", "root"] as const;
export const contestRoles = ["contest_staff", "contest_manager", "contest_judge"] as const;

/**
 * Global and contest-scoped roles share one union because both can end up in a
 * permission set, but they are granted through different endpoints: global
 * roles through `/admin/users/{id}/roles`, contest roles through
 * `/contests/{id}/roles`. They stay listed separately so a UI never offers a
 * contest role in a global picker, and never offers a global role in the
 * contest picker.
 */
export const roles = [...globalRoles, ...contestRoles] as const;
export type Role = (typeof roles)[number];
export type GlobalRole = (typeof globalRoles)[number];
export type ContestRole = (typeof contestRoles)[number];

/** Roles that carry every known permission, mirroring the backend authz package. */
export const fullAccessRoles = ["admin", "root"] as const satisfies readonly GlobalRole[];

export const permissions = [
  "problem.read",
  "problem.create",
  "problem.edit_own",
  "problem.testcase.manage_own",
  "problem.check_own",
  "problem.submit_review",
  "problem.review",
  "problem.publish",
  "problem.manage_all",
  "submission.create",
  "submission.read_own",
  "submission.rejudge",
  "judge.inspect",
  "contest.join",
  "contest.read",
  "contest.manage",
  "contest.judge",
  "contest.manage_all",
  "user.manage",
  "role.grant",
  "role.revoke",
  "system.manage",
] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  user: ["problem.read", "submission.create", "submission.read_own", "contest.join"],
  author: ["problem.create", "problem.edit_own", "problem.testcase.manage_own", "problem.check_own", "problem.submit_review"],
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

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (permissions as readonly string[]).includes(value);
}

export function isGlobalRole(value: unknown): value is GlobalRole {
  return typeof value === "string" && (globalRoles as readonly string[]).includes(value);
}

export function isContestRole(value: unknown): value is ContestRole {
  return typeof value === "string" && (contestRoles as readonly string[]).includes(value);
}
