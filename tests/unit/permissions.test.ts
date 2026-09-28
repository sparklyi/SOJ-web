import { describe, expect, it } from "vitest";
import {
  contestRoles,
  fullAccessRoles,
  globalRoles,
  isContestRole,
  isGlobalRole,
  isPermission,
  isRole,
  permissions,
  roles,
} from "@/lib/auth/permissions";
import { permissionsForRoles } from "@/lib/mock/role-permissions";

describe("role and permission catalog", () => {
  it("mirrors the backend role split", () => {
    expect(globalRoles).toEqual(["user", "author", "reviewer", "operator", "admin", "root"]);
    expect(contestRoles).toEqual(["contest_staff", "contest_manager", "contest_judge"]);
    expect(roles).toEqual([...globalRoles, ...contestRoles]);
  });

  it("publishes the phase-one permission catalog", () => {
    expect(permissions).toHaveLength(19);
    expect(new Set(permissions).size).toBe(permissions.length);
    expect(permissions).toContain("system.manage");
    expect(permissions).toContain("contest.create");
    expect(permissions).toContain("audit.read");
    expect(permissions).toContain("role.permission.manage");
    // The six removed phase-one permissions must not survive as aliases.
    expect(permissions).not.toContain("problem.read");
    expect(permissions).not.toContain("submission.create");
    expect(permissions).not.toContain("contest.join");
  });

  it("grants every permission to full access roles", () => {
    for (const role of fullAccessRoles) {
      expect(permissionsForRoles(role)).toEqual([...permissions]);
    }
  });

  it("scopes contest roles to contest permissions", () => {
    expect(permissionsForRoles("contest_staff")).toEqual(["contest.read"]);
    expect(permissionsForRoles("contest_manager")).toEqual(["contest.read", "contest.manage"]);
    expect(permissionsForRoles("contest_judge")).toEqual(["contest.read", "contest.judge"]);
  });

  it("keeps the mock role mappings aligned with the phase-one defaults", () => {
    expect(permissionsForRoles("user")).toEqual([]);
    expect(permissionsForRoles("author")).toEqual(["problem.create", "problem.edit_own", "problem.submit_review"]);
    expect(permissionsForRoles("reviewer")).toEqual(["problem.review", "problem.publish"]);
    expect(permissionsForRoles("operator")).toEqual(["submission.rejudge", "judge.inspect"]);
    expect(permissionsForRoles("user", "author")).toEqual(["problem.create", "problem.edit_own", "problem.submit_review"]);
  });

  it("separates global roles from contest roles", () => {
    expect(isGlobalRole("admin")).toBe(true);
    expect(isGlobalRole("contest_manager")).toBe(false);
    expect(isContestRole("contest_manager")).toBe(true);
    expect(isContestRole("admin")).toBe(false);
    expect(isRole("contest_judge")).toBe(true);
    expect(isRole("intruder")).toBe(false);
    expect(isPermission("contest.create")).toBe(true);
    expect(isPermission("problem.solve")).toBe(false);
  });
});
