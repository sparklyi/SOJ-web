export const roles = ["user", "author", "reviewer", "operator", "admin", "root"] as const;
export type Role = (typeof roles)[number];

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
    "problem.read",
    "problem.testcase.manage_own",
    "problem.check_own",
    "problem.manage_all",
    "user.manage",
    "problem.create",
    "problem.edit_own",
    "problem.submit_review",
    "problem.review",
    "problem.publish",
    "submission.create",
    "submission.read_own",
    "submission.rejudge",
    "judge.inspect",
    "contest.join",
    "contest.read",
    "contest.manage",
    "contest.judge",
    "contest.manage_all",
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
