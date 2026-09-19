import { describe, expect, it } from "vitest";
import { createMockAdapter } from "@/lib/api/mock-adapter";
import {
  mockAdminUser,
  mockAuthorUser,
  mockContestManagerUser,
  mockOperatorUser,
  mockReviewerUser,
  mockUser,
} from "@/lib/mock/fixtures";

/**
 * The mock adapter is the only place where the RBAC rules can be exercised
 * without a backend, so these tests pin the same authorization decisions the Go
 * handlers make: who may read a queue, who may decide a review, who may
 * administer contest roles, who may re-judge, and who may touch global roles.
 */

const reviewerNotOwner = { ...mockReviewerUser, id: 21 };
const contestManagerForContestOne = { ...mockContestManagerUser, id: 21 };

describe("problem review surfaces", () => {
  it("hides the review queue from an author-only session", async () => {
    const client = createMockAdapter({ currentUser: mockAuthorUser });
    await expect(client.problems.reviewQueue()).rejects.toMatchObject({ code: "auth.forbidden", status: 403 });
  });

  it("returns every problem waiting for review to a reviewer", async () => {
    const client = createMockAdapter({ currentUser: mockReviewerUser });
    const queue = await client.problems.reviewQueue();
    expect(queue.total).toBeGreaterThan(0);
    expect(queue.items.every((problem) => problem.publicationStatus === "in_review")).toBe(true);
  });

  it("blocks a reviewer from deciding a problem they own", async () => {
    const client = createMockAdapter({ currentUser: mockReviewerUser });
    const queue = await client.problems.reviewQueue();
    const ownProblem = queue.items[0];
    expect(ownProblem.ownerUserId).toBe(mockReviewerUser.id);
    await expect(client.problems.decideReview(ownProblem.id, { decision: "approve", comment: "looks good" })).rejects.toMatchObject({
      code: "problem.self_review_forbidden",
      status: 403,
    });
  });

  it("publishes an approved problem and records the decision", async () => {
    const client = createMockAdapter({ currentUser: reviewerNotOwner });
    const queue = await client.problems.reviewQueue();
    const target = queue.items[0];

    await expect(client.problems.decideReview(target.id, { decision: "approve", comment: "checked the edge cases" })).resolves.toMatchObject({
      publicationStatus: "published",
    });

    const events = await client.problems.reviewEvents(target.id);
    expect(events[0]).toMatchObject({ decision: "approve", fromStatus: "in_review", toStatus: "published", actorUserId: reviewerNotOwner.id });
  });

  it("sends a rejected problem back to the author", async () => {
    const client = createMockAdapter({ currentUser: reviewerNotOwner });
    const remaining = await client.problems.reviewQueue();
    const target = remaining.items[0];

    await expect(client.problems.decideReview(target.id, { decision: "request_changes", comment: "weak constraints" })).resolves.toMatchObject({
      publicationStatus: "changes_requested",
    });
  });
});

describe("contest role administration", () => {
  it("denies a plain user", async () => {
    const client = createMockAdapter({ currentUser: mockUser });
    await expect(client.contests.listRoles(1)).rejects.toMatchObject({ code: "contest.not_allowed", status: 403 });
  });

  it("allows an admin because contest.manage_all is part of the full-access set", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    const assignments = await client.contests.listRoles(1);
    expect(assignments.every((assignment) => assignment.contestId === 1)).toBe(true);
  });

  it("allows a contest-scoped manager for that contest", async () => {
    const client = createMockAdapter({ currentUser: contestManagerForContestOne });
    await expect(client.contests.listRoles(1)).resolves.toBeInstanceOf(Array);
  });

  it("refuses a contest role grant the target already holds", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    await expect(client.contests.grantRole(1, { userId: 21, role: "contest_manager", reason: "duplicate" })).rejects.toMatchObject({
      code: "contest.role_exists",
      status: 409,
    });
  });

  it("refuses a self-grant and then records a legitimate one", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    await expect(client.contests.grantRole(1, { userId: mockAdminUser.id, role: "contest_judge", reason: "self" })).rejects.toMatchObject({
      code: "contest.role_self_grant_forbidden",
      status: 403,
    });

    const assignment = await client.contests.grantRole(1, { userId: 99, role: "contest_judge", reason: "judge coverage" });
    expect(assignment).toMatchObject({ contestId: 1, userId: 99, role: "contest_judge", grantedBy: mockAdminUser.id });

    const assignments = await client.contests.listRoles(1);
    expect(assignments.map((item) => item.userId)).toContain(99);
  });

  it("projects only the caller's own contest roles onto the contest payload", async () => {
    const judge = createMockAdapter({ currentUser: { ...mockUser, id: 33 } });
    await expect(judge.contests.get(1)).resolves.toMatchObject({ currentUserRoles: ["contest_judge"] });
    // The same account holds nothing in the other contest.
    await expect(judge.contests.get(2)).resolves.toMatchObject({ currentUserRoles: [] });

    const stranger = createMockAdapter({ currentUser: { ...mockUser, id: 4242 } });
    await expect(stranger.contests.get(1)).resolves.toMatchObject({ currentUserRoles: [] });
  });
});

describe("rejudge console", () => {
  // A plain user holding nothing global; user 33 only carries the fixture's
  // `contest_judge` assignment inside contest 1.
  const assignedContestJudge = { ...mockUser, id: 33 };

  it("scopes the batch list to the caller and widens it for an admin", async () => {
    const operator = createMockAdapter({ currentUser: mockOperatorUser });
    const ownBatches = await operator.rejudge.list();
    expect(ownBatches.items.every((batch) => batch.requestedBy === mockOperatorUser.id)).toBe(true);

    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const allBatches = await admin.rejudge.list();
    expect(allBatches.total).toBeGreaterThanOrEqual(ownBatches.total);
  });

  it("denies a problem target to a session without submission.rejudge", async () => {
    const client = createMockAdapter({ currentUser: mockReviewerUser });
    await expect(client.rejudge.create({ problemId: 1, reason: "no rights" })).rejects.toMatchObject({
      code: "auth.forbidden",
      status: 403,
    });
  });

  it("denies a contest target to a plain user", async () => {
    const client = createMockAdapter({ currentUser: mockUser });
    await expect(client.rejudge.create({ contestId: 1, reason: "no rights" })).rejects.toMatchObject({
      code: "contest.not_allowed",
      status: 403,
    });
  });

  it("accepts a contest target from a contest judge assigned to that contest", async () => {
    const client = createMockAdapter({ currentUser: assignedContestJudge });
    await expect(client.rejudge.create({ contestId: 1, reason: "judge re-run" })).resolves.toMatchObject({
      contestId: 1,
      status: "queued",
    });
  });

  it("still denies that judge on a contest they are not assigned to", async () => {
    const client = createMockAdapter({ currentUser: assignedContestJudge });
    await expect(client.rejudge.create({ contestId: 2, reason: "not my contest" })).rejects.toMatchObject({
      code: "contest.not_allowed",
      status: 403,
    });
  });

  it("rejects a request that carries both a problem and a contest target", async () => {
    const client = createMockAdapter({ currentUser: mockOperatorUser });
    await expect(client.rejudge.create({ problemId: 1, contestId: 1, reason: "both" })).rejects.toMatchObject({
      code: "rejudge.target_invalid",
      status: 400,
    });
  });

  it("creates a queued batch for an operator and exposes its detail", async () => {
    const client = createMockAdapter({ currentUser: mockOperatorUser });
    const batch = await client.rejudge.create({ problemId: 4, reason: "checker fix" });
    expect(batch).toMatchObject({ problemId: 4, status: "queued", requestedBy: mockOperatorUser.id });

    await expect(client.rejudge.get(batch.id)).resolves.toMatchObject({ batch: { id: batch.id }, items: [] });

    const canceled = await client.rejudge.cancel(batch.id, { reason: "wrong target" });
    expect(canceled.status).toBe("canceled");
  });
});

describe("global role administration", () => {
  it("denies a session without user.manage", async () => {
    const client = createMockAdapter({ currentUser: mockAuthorUser });
    await expect(client.admin.listUsers()).rejects.toMatchObject({ code: "auth.forbidden", status: 403 });
  });

  it("filters users by keyword", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    const page = await client.admin.listUsers({ keyword: "aya" });
    expect(page.items.map((user) => user.handle)).toEqual(["aya-sato"]);
  });

  it("rejects a role change against the acting account", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    await expect(client.admin.grantRole(mockAdminUser.id, { role: "author", reason: "self" })).rejects.toMatchObject({
      code: "role.invalid_target",
      status: 400,
    });
  });

  it("grants then revokes a global role", async () => {
    const client = createMockAdapter({ currentUser: mockAdminUser });
    const assignment = await client.admin.grantRole(12, { role: "operator", reason: "queue coverage" });
    expect(assignment).toMatchObject({ userId: 12, role: "operator", grantedBy: mockAdminUser.id });

    const granted = await client.admin.listUsers({ keyword: "aya" });
    expect(granted.items[0].roles).toContain("operator");

    await expect(client.admin.revokeRole(12, { role: "operator", reason: "no longer needed" })).resolves.toBeUndefined();
    const revoked = await client.admin.listUsers({ keyword: "aya" });
    expect(revoked.items[0].roles).not.toContain("operator");
  });
});
