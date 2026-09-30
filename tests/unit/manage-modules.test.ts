import { describe, expect, it } from "vitest";
import {
  canOpenManage,
  canOpenManageGate,
  manageModulePermissions,
  manageModules,
  visibleManageModules,
} from "@/features/manage/modules";
import { permissions, type Permission } from "@/lib/auth/permissions";

function canFrom(...held: Permission[]) {
  return (permission: Permission) => held.includes(permission);
}

describe("manage registry", () => {
  it("keeps module paths unique and every gate permission in the catalog", () => {
    expect(new Set(manageModules.map((module) => module.path)).size).toBe(manageModules.length);
    expect(manageModulePermissions().length).toBeGreaterThan(0);
    for (const permission of manageModulePermissions()) {
      expect(permissions).toContain(permission);
    }
  });

  it("opens only the authoring card for an author", () => {
    const can = canFrom("problem.create", "problem.edit_own", "problem.submit_review");
    expect(visibleManageModules(can).map((module) => module.key)).toEqual(["authoring"]);
    expect(canOpenManage(can)).toBe(true);
  });

  it("opens the authoring console and review queue for a reviewer", () => {
    // problem.review is part of problem.authoring.access on the backend
    // (CanAccessAuthoring), so a reviewer legitimately sees both cards.
    const can = canFrom("problem.review", "problem.publish");
    expect(visibleManageModules(can).map((module) => module.key)).toEqual(["authoring", "review"]);
  });

  it("opens only the rejudge card for an operator", () => {
    const can = canFrom("submission.rejudge", "judge.inspect");
    expect(visibleManageModules(can).map((module) => module.key)).toEqual(["rejudge"]);
  });

  it("keeps the workbench closed for a plain account or an edit-only author", () => {
    expect(canOpenManage(canFrom())).toBe(false);
    // problem.edit_own alone is not enough to open the authoring console on the
    // backend either; the old issue text listed it, the consolidated gate does not.
    expect(visibleManageModules(canFrom("problem.edit_own"))).toEqual([]);
  });

  it("opens every card for a full-access account", () => {
    const can = () => true;
    expect(visibleManageModules(can).map((module) => module.key)).toEqual(["authoring", "review", "rejudge"]);
  });

  it("does not treat publish alone as queue or console access", () => {
    expect(canOpenManageGate("problem.review.queue", canFrom("problem.publish"))).toBe(false);
    expect(canOpenManageGate("problem.authoring.access", canFrom("problem.publish"))).toBe(false);
    expect(canOpenManageGate("problem.review.queue", canFrom("problem.manage_all"))).toBe(true);
    expect(canOpenManageGate("problem.authoring.access", canFrom("problem.manage_all"))).toBe(true);
  });
});
