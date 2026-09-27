import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockAdapter } from "@/lib/api/mock-adapter";
import { mockAdminUser, mockAuthorUser, mockUser } from "@/lib/mock/fixtures";
import { getApiMode } from "@/lib/api/mode";

describe("api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to mock mode for local review", () => {
    expect(getApiMode({})).toBe("mock");
  });

  it("reads the public mode from the client build environment", () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_MODE", "http");
    expect(getApiMode()).toBe("http");
  });

  it("defaults to HTTP mode for production when no mode is configured", () => {
    expect(getApiMode({ NODE_ENV: "production" })).toBe("http");
  });

  it("returns fixture problems in mock mode", async () => {
    // 站点策略：题库内容只对已登录 actor 开放，mock 与后端一致。
    const client = createMockAdapter({ currentUser: mockUser });
    const problems = await client.problems.list();
    expect(problems.items.length).toBeGreaterThanOrEqual(8);
  });

  it("includes contests in mock mode", async () => {
    const client = createMockAdapter({ currentUser: mockUser });
    const contests = await client.contests.list();
    expect(contests.items.length).toBeGreaterThanOrEqual(2);
  });

  it("returns a finished run for a playground run with no problem", async () => {
    const client = createMockAdapter({ currentUser: mockUser });
    const run = await client.runs.create({ languageId: 60, sourceCode: "package main", stdin: "7\n" });

    // 夹具必须回终态：回 queued 的话练习场在 mock 模式下会一路轮询到截止，
    // 评审看到的是一个永远转圈的页面。
    expect(run.status).toBe("accepted");
    expect(run.problemId).toBeUndefined();
    expect(run.stdout).toContain("7");
  });

  it("raises typed not found errors", async () => {
    const client = createMockAdapter({ currentUser: mockUser });
    await expect(client.problems.get(404)).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("denies problem authoring to a user without the authoring capability", async () => {
    await expect(createMockAdapter({ currentUser: mockUser }).problems.listMine()).rejects.toMatchObject({
      code: "problem.forbidden",
      status: 403,
    });
    await expect(createMockAdapter({ currentUser: mockAuthorUser }).problems.listMine()).resolves.toMatchObject({ total: expect.any(Number) });
  });
});

describe("admin console adapter", () => {
  it("gates language administration behind system.manage and audits the toggle", async () => {
    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const listed = await admin.admin.languages.list();
    expect(listed.items.length).toBeGreaterThan(0);

    const target = listed.items.find((language) => language.enabled);
    expect(target).toBeDefined();
    const updated = await admin.admin.languages.update(target!.id, { enabled: false });
    expect(updated.enabled).toBe(false);
    await expect(createMockAdapter({ currentUser: mockUser }).admin.languages.update(target!.id, { enabled: true })).rejects.toMatchObject({
      status: 403,
    });

    const events = await admin.admin.audit.list({ objectType: "language", objectId: target!.id });
    expect(events.items.some((event) => event.action === "language.disabled")).toBe(true);
  });

  it("archives and restores problems for problem.manage_all", async () => {
    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const listed = await admin.admin.problems.list();
    const target = listed.items.find((problem) => problem.publicationStatus !== "archived");
    expect(target).toBeDefined();

    await admin.admin.problems.archive(target!.id);
    const archived = await admin.admin.problems.list();
    expect(archived.items.find((problem) => problem.id === target!.id)?.publicationStatus).toBe("archived");
    const restored = await admin.admin.problems.restore(target!.id);
    expect(restored.publicationStatus).not.toBe("archived");

    await expect(createMockAdapter({ currentUser: mockAuthorUser }).admin.problems.archive(target!.id)).rejects.toMatchObject({ status: 403 });
  });

  it("creates and archives contests for contest.manage_all", async () => {
    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const created = await admin.admin.contests.create({
      title: "Adapter Round",
      visibility: "public",
      status: "draft",
      startAt: new Date("2030-01-01T10:00:00Z").toISOString(),
      endAt: new Date("2030-01-01T12:00:00Z").toISOString(),
      freezeAt: new Date("2030-01-01T11:00:00Z").toISOString(),
    });
    expect(created.id).toBeGreaterThan(0);

    await admin.admin.contests.archive(created.id);
    const archived = await admin.admin.contests.list({ status: "archived" });
    expect(archived.items.some((contest) => contest.id === created.id)).toBe(true);
  });

  it("filters audit events by object", async () => {
    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const events = await admin.admin.audit.list({ objectType: "problem", objectId: 5 });
    expect(events.items.length).toBeGreaterThan(0);
    expect(events.items.every((event) => event.objectType === "problem" && event.objectId === 5)).toBe(true);
  });

  it("paginates admin lists and reports the unpaged total", async () => {
    const admin = createMockAdapter({ currentUser: mockAdminUser });
    const first = await admin.admin.problems.list({ page: 1, pageSize: 2 });
    const second = await admin.admin.problems.list({ page: 2, pageSize: 2 });

    expect(first.items).toHaveLength(2);
    expect(first.total).toBeGreaterThan(2);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });
});
