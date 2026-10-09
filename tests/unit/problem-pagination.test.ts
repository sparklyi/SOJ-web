import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { createMockAdapter } from "@/lib/api/mock-adapter";
import { listProblems } from "@/features/problems/api";
import { parseProblemFilter } from "@/lib/domain/problem";

afterEach(() => vi.unstubAllGlobals());

function problem(id: number) {
  return { id, title: `Problem ${id}`, slug: `problem-${id}`, difficulty: "easy", tags: [], status: "published", visibility: "public", owner_user_id: 7, limits: { time_limit_ms: 1000, memory_limit_kb: 262144 }, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", accepted_count: 0, submission_count: 0 };
}

function pagedFetch(total: number) {
  return vi.fn(async (url: string | URL | Request) => {
    const params = new URL(String(url)).searchParams;
    const page = Number(params.get("page"));
    const size = Number(params.get("page_size"));
    const start = (page - 1) * size;
    return Response.json({ data: { items: Array.from({ length: Math.max(0, Math.min(size, total - start)) }, (_, i) => problem(start + i + 1)), total, page, page_size: size }, error: null });
  });
}

describe("server-paged problem lists", () => {
  it.each([0, 100, 150, 200, 250])("loads only one page out of %i problems while preserving the full total", async (total) => {
    const fetchMock = pagedFetch(total);
    vi.stubGlobal("fetch", fetchMock);
    const result = await listProblems({}, createHttpAdapter());
    expect(result.items).toHaveLength(Math.min(20, total));
    expect(result.total).toBe(total);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("page=1&page_size=20");
  });

  it("fetches the requested later page rather than reading every previous page", async () => {
    const fetchMock = pagedFetch(250);
    vi.stubGlobal("fetch", fetchMock);
    const result = await listProblems({ page: 6, pageSize: 20 }, createHttpAdapter());
    expect(result.items).toHaveLength(20);
    expect(result.items[0].id).toBe(101);
    expect(result.total).toBe(250);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("page=6&page_size=20");
  });

  it("retains the real total on the final partial page", async () => {
    vi.stubGlobal("fetch", pagedFetch(250));
    const result = await listProblems({ page: 13 }, createHttpAdapter());
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(250);
  });

  it("delegates keyword, difficulty and tag filters to the server", async () => {
    const fetchMock = vi.fn(async () => Response.json({ data: { items: [problem(150)], total: 1 }, error: null }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await listProblems({ query: "Problem 150", difficulty: "hard", tag: "later-page", page: 1, pageSize: 20 }, createHttpAdapter());
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/problems?page=1&page_size=20&keyword=Problem+150&difficulty=hard&tag=later-page", { cache: "no-store" });
    expect(result.items[0].id).toBe(150);
    expect(result.total).toBe(1);
  });

  it("loads a single authenticated page of owned problems", async () => {
    const fetchMock = pagedFetch(150);
    vi.stubGlobal("fetch", fetchMock);
    const result = await createHttpAdapter({ accessToken: "owner-token" }).problems.listMine({ page: 2, pageSize: 20 });
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(150);
    expect(result.items[0].id).toBe(21);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/problems?page=2&page_size=20&mine=true", { cache: "no-store", headers: { Authorization: "Bearer owner-token" } });
  });

  it("keeps mock filtering and pagination consistent with HTTP", async () => {
    const client = createMockAdapter();
    const first = await client.problems.list({ page: 1, pageSize: 2 });
    const second = await client.problems.list({ page: 2, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(first.total).toBe(second.total);
    expect(first.items.map((item) => item.id)).not.toEqual(second.items.map((item) => item.id));
    const result = await client.problems.list({ tag: "graphs", pageSize: 1 });
    expect(result.items.every((item) => item.tags.includes("graphs"))).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it.each([{}, { page: "-1", page_size: "0" }, { page: "invalid", page_size: "101" }, { page: "99999999999999", page_size: "20" }])("uses safe defaults for invalid pagination %j", (params) => {
    expect(parseProblemFilter(params)).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("restores page, size and filters from a direct URL", () => {
    expect(parseProblemFilter({ q: " DP ", difficulty: "hard", tag: "graphs", page: "3", page_size: "50" })).toEqual({ query: "DP", difficulty: "hard", tag: "graphs", page: 3, pageSize: 50 });
  });
});
