export const roles = ["user", "author", "reviewer", "operator", "admin", "root"] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  "problem.solve",
  "problem.create",
  "problem.edit_own",
  "problem.submit_review",
  "problem.review",
  "problem.publish",
  "problem.manage_all",
  "submission.create",
  "submission.rejudge",
  "judge.inspect",
  "contest.join",
  "contest.manage_all",
  "user.manage",
  "role.grant",
  "role.revoke",
  "system.manage",
] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  user: ["problem.solve", "submission.create", "contest.join"],
  author: ["problem.create", "problem.edit_own", "problem.submit_review"],
  reviewer: ["problem.review", "problem.publish"],
  operator: ["submission.rejudge", "judge.inspect"],
  admin: [
    "problem.manage_all",
    "contest.manage_all",
    "user.manage",
    "problem.create",
    "problem.edit_own",
    "problem.submit_review",
    "problem.review",
    "problem.publish",
    "submission.rejudge",
    "judge.inspect",
  ],
  root: [
    "problem.manage_all",
    "contest.manage_all",
    "user.manage",
    "problem.create",
    "problem.edit_own",
    "problem.submit_review",
    "problem.review",
    "problem.publish",
    "submission.rejudge",
    "judge.inspect",
    "role.grant",
    "role.revoke",
    "system.manage",
  ],
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
