import { describe, expect, it } from "vitest";
import { createApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getApiMode } from "@/lib/api/mode";

describe("api mode", () => {
  it("defaults to mock mode for local review", () => {
    expect(getApiMode({})).toBe("mock");
  });

  it("returns fixture problems in mock mode", async () => {
    const client = createApiClient({ mode: "mock" });
    const problems = await client.problems.list();
    expect(problems.items.length).toBeGreaterThanOrEqual(8);
  });

  it("includes ACM and OI contests in mock mode", async () => {
    const client = createApiClient({ mode: "mock" });
    const contests = await client.contests.list();
    expect(contests.items.map((contest) => contest.type)).toEqual(expect.arrayContaining(["acm", "oi"]));
  });

  it("raises typed not found errors", async () => {
    const client = createApiClient({ mode: "mock" });
    await expect(client.problems.get(404)).rejects.toBeInstanceOf(ApiError);
  });
});
