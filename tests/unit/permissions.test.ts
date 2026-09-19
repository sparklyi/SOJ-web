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
  permissionsForRoles,
  roles,
} from "@/lib/auth/permissions";

describe("role and permission catalog", () => {
  it("mirrors the backend role split", () => {
    expect(globalRoles).toEqual(["user", "author", "reviewer", "operator", "admin", "root"]);
    expect(contestRoles).toEqual(["contest_staff", "contest_manager", "contest_judge"]);
    expect(roles).toEqual([...globalRoles, ...contestRoles]);
  });

  it("publishes the full permission catalog", () => {
    expect(permissions).toHaveLength(22);
    expect(new Set(permissions).size).toBe(permissions.length);
    expect(permissions).toContain("problem.read");
    expect(permissions).toContain("system.manage");
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

  it("keeps the remaining role mappings aligned with the backend", () => {
    expect(permissionsForRoles("user")).toEqual(["problem.read", "submission.create", "submission.read_own", "contest.join"]);
    expect(permissionsForRoles("reviewer")).toEqual(["problem.review", "problem.publish"]);
    expect(permissionsForRoles("operator")).toEqual(["submission.rejudge", "judge.inspect"]);
    expect(permissionsForRoles("user", "author")).toEqual([
      "problem.read",
      "problem.create",
      "problem.edit_own",
      "problem.testcase.manage_own",
      "problem.check_own",
      "problem.submit_review",
      "submission.create",
      "submission.read_own",
      "contest.join",
    ]);
  });

  it("separates global roles from contest roles", () => {
    expect(isGlobalRole("admin")).toBe(true);
    expect(isGlobalRole("contest_manager")).toBe(false);
    expect(isContestRole("contest_manager")).toBe(true);
    expect(isContestRole("admin")).toBe(false);
    expect(isRole("contest_judge")).toBe(true);
    expect(isRole("intruder")).toBe(false);
    expect(isPermission("problem.read")).toBe(true);
    expect(isPermission("problem.solve")).toBe(false);
  });
});
