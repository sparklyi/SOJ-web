import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockAdapter } from "@/lib/api/mock-adapter";
import { mockAuthorUser, mockUser } from "@/lib/mock/fixtures";
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
