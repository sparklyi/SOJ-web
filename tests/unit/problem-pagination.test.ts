import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { listProblems } from "@/features/problems/api";

afterEach(() => vi.unstubAllGlobals());

function problem(id: number) {
  return { id, title: `Problem ${id}`, slug: `problem-${id}`, difficulty: id > 100 ? "hard" : "easy", tags: id > 100 ? ["later-page"] : [], status: "published", visibility: "public", owner_user_id: 7, limits: { time_limit_ms: 1000, memory_limit_kb: 262144 }, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", accepted_count: 0, submission_count: 0 };
}

function pagedFetch(total: number) {
  return vi.fn(async (url: string | URL | Request) => {
    const page = Number(new URL(String(url)).searchParams.get("page"));
    const start = (page - 1) * 100;
    return Response.json({ data: { items: Array.from({ length: Math.max(0, Math.min(100, total - start)) }, (_, i) => problem(start + i + 1)), total, page, page_size: 100 }, error: null });
  });
}

describe("complete problem lists", () => {
  it.each([0, 100, 150, 200, 250])("loads all %i public problems and preserves their total", async (total) => {
    const fetchMock = pagedFetch(total);
    vi.stubGlobal("fetch", fetchMock);
    const result = await listProblems({}, createHttpAdapter());
    expect(result.items).toHaveLength(total);
    expect(result.total).toBe(total);
    expect(new Set(result.items.map((item) => item.id)).size).toBe(total);
    expect(fetchMock).toHaveBeenCalledTimes(Math.max(1, Math.ceil(total / 100)));
  });

  it("finds difficulty, keyword and tag matches beyond the first 100 problems", async () => {
    vi.stubGlobal("fetch", pagedFetch(150));
    const result = await listProblems({ difficulty: "hard", tag: "later-page", query: "Problem 150" }, createHttpAdapter());
    expect(result.items.map((item) => item.id)).toEqual([150]);
    expect(result.total).toBe(1);
  });

  it("loads every owned problem with authentication and mine filtering on every page", async () => {
    const fetchMock = pagedFetch(150);
    vi.stubGlobal("fetch", fetchMock);
    const result = await createHttpAdapter({ accessToken: "owner-token" }).problems.listMine();
    expect(result.items).toHaveLength(150);
    expect(result.total).toBe(150);
    expect(result.items.at(-1)?.id).toBe(150);
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).toContain("page_size=100&mine=true");
    }
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/problems?page=2&page_size=100&mine=true", { cache: "no-store", headers: { Authorization: "Bearer owner-token" } });
  });

  it("rejects an incomplete response instead of displaying a truncated list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: { items: [], total: 150, page: 1, page_size: 100 }, error: null })));
    await expect(createHttpAdapter().problems.list()).rejects.toMatchObject({ code: "api.incomplete_problem_list" });
  });

  it("propagates failures on later pages", async () => {
    const fetchMock = pagedFetch(150);
    fetchMock.mockImplementationOnce(async () => Response.json({ data: { items: Array.from({ length: 100 }, (_, i) => problem(i + 1)), total: 150 }, error: null }));
    fetchMock.mockImplementationOnce(async () => Response.json({ data: null, error: { code: "backend.unavailable", message: "Unavailable" } }, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createHttpAdapter().problems.list()).rejects.toMatchObject({ status: 503 });
  });
});
