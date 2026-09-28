import { describe, expect, it } from "vitest";
import { canAccessAuthoring, canDecideReview, canViewReviewQueue, gatePermissions } from "@/lib/auth/gates";
import { permissions, type Permission } from "@/lib/auth/permissions";

function canFrom(...granted: Permission[]) {
  const held = new Set<string>(granted);
  return (permission: Permission) => held.has(permission);
}

/**
 * `gatePermissions` names and sets must stay one-for-one with the backend
 * `internal/authz/Combos()`. The Go side pins the same table; these tests are
 * the front-end half of that contract.
 */
describe("combo gates", () => {
  it("only references permissions that exist in the catalog", () => {
    for (const combo of Object.values(gatePermissions)) {
      for (const permission of combo) {
        expect(permissions).toContain(permission);
      }
    }
  });

  it("opens authoring for any one authoring permission", () => {
    expect(canAccessAuthoring(canFrom("problem.create"))).toBe(true);
    expect(canAccessAuthoring(canFrom("problem.review"))).toBe(true);
    expect(canAccessAuthoring(canFrom("problem.manage_all"))).toBe(true);
    expect(canAccessAuthoring(canFrom())).toBe(false);
  });

  it("opens the review queue for review or manage_all", () => {
    expect(canViewReviewQueue(canFrom("problem.review"))).toBe(true);
    expect(canViewReviewQueue(canFrom("problem.manage_all"))).toBe(true);
    expect(canViewReviewQueue(canFrom("problem.publish"))).toBe(false);
    expect(canViewReviewQueue(canFrom())).toBe(false);
  });

  it("requires review and publish together to decide a review", () => {
    expect(canDecideReview(canFrom("problem.review", "problem.publish"))).toBe(true);
    expect(canDecideReview(canFrom("problem.review"))).toBe(false);
    expect(canDecideReview(canFrom("problem.publish"))).toBe(false);
    expect(canDecideReview(canFrom("problem.manage_all"))).toBe(true);
    expect(canDecideReview(canFrom())).toBe(false);
  });
});
