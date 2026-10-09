import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";

// A local HTTP fixture exercises SSR, the browser proxy and URL navigation.
// No production reads, accounts or backend writes are involved.
// Run with SOJ_HTTP_API_PORT=3199 and playwright.http.config.ts.
const apiPort = Number(process.env.SOJ_HTTP_API_PORT ?? 3199);
let server: Server;
let queries: URLSearchParams[] = [];
const problems = Array.from({ length: 250 }, (_, index) => {
  const id = index + 1;
  return { id, title: `Problem ${id}`, slug: `problem-${id}`, difficulty: id > 100 ? "hard" : "easy", tags: id > 100 ? ["later-page"] : ["basics"], status: "published", visibility: "public", owner_user_id: 7, limits: { time_limit_ms: 1000, memory_limit_kb: 262144 }, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", accepted_count: 0, submission_count: 0 };
});

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url!, `http://127.0.0.1:${apiPort}`);
    response.setHeader("Content-Type", "application/json");
    if (url.pathname === "/api/v1/problems") {
      const params = url.searchParams;
      queries.push(params);
      let items = problems;
      const keyword = params.get("keyword")?.toLowerCase();
      if (keyword) items = items.filter((item) => `${item.title} ${item.slug}`.toLowerCase().includes(keyword));
      if (params.has("difficulty")) items = items.filter((item) => item.difficulty === params.get("difficulty"));
      if (params.has("tag")) items = items.filter((item) => item.tags.includes(params.get("tag")!));
      const page = Number(params.get("page") ?? 1);
      const size = Number(params.get("page_size") ?? 20);
      response.end(JSON.stringify({ data: { items: items.slice((page - 1) * size, page * size), total: items.length, page, page_size: size }, error: null }));
      return;
    }
    if (url.pathname === "/api/v1/me") {
      response.end(JSON.stringify({ data: { id: 7, username: "test-author", roles: ["author"], permissions: ["problem.create"], status: "active" }, error: null }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ data: null, error: { code: "not_found", message: "Not found" } }));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(apiPort, "127.0.0.1", resolve);
  });
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});
test.beforeEach(() => { queries = []; });

test("public catalog requests one page, navigates, reloads and changes page size", async ({ page }) => {
  await page.goto("/en/problems");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(20);
  await expect(page.getByText("250 total", { exact: true })).toBeVisible();
  expect(queries.map((query) => query.get("page"))).toEqual(["1"]);
  await page.screenshot({ path: test.info().outputPath("catalog-top-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: test.info().outputPath("catalog-top-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(rows.first()).toContainText("Problem 21");
  await expect(rows).toHaveCount(20);
  await page.reload();
  await expect(rows.first()).toContainText("Problem 21");
  await page.getByRole("combobox", { name: "Per page" }).click();
  await page.getByRole("option", { name: "50", exact: true }).click();
  await expect(page).toHaveURL(/page=1&page_size=50/);
  await expect(rows).toHaveCount(50);
  await expect(rows.first()).toContainText("Problem 1");
  expect(queries.every((query) => Number(query.get("page")) <= 2)).toBe(true);
});

test("filters find problems beyond the first 100 and reset the page", async ({ page }) => {
  await page.goto("/en/problems?page=2");
  await page.getByLabel("Search problems").fill("Problem 150");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Problem 150");
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await page.getByLabel("Search problems").fill("");
  await page.getByRole("combobox", { name: "Tag", exact: true }).fill("later-page");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await expect(page.locator("tbody tr").first()).toContainText("Problem 101");
  await expect(page.getByText("150 total", { exact: true })).toBeVisible();
  await page.getByRole("group", { name: "Difficulty" }).getByRole("button", { name: "Hard" }).click();
  await expect(page).toHaveURL(/difficulty=hard/);
  await expect(page.locator("tbody tr").first()).toContainText("Problem 101");
  expect(queries.some((query) => query.get("tag") === "later-page" && query.get("difficulty") === "hard")).toBe(true);
});

test("empty filters keep the keyword and recover to a valid page", async ({ page }) => {
  await page.goto("/en/problems?page=2");
  await page.getByLabel("Search problems").fill("all");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/q=all/);
  await expect(page.getByText("No matching problems", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);
  await page.goto("/en/problems?q=all&page=999");
  await expect(page).toHaveURL(/q=all&page=1/);
  await expect(page.getByText("No matching problems", { exact: true })).toBeVisible();
});

test("out-of-range pages clamp to the last page and pagination fits mobile", async ({ page }) => {
  await page.goto("/en/problems?page=999");
  await expect(page).toHaveURL(/page=13/);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(page.locator("tbody tr").first()).toContainText("Problem 241");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByRole("navigation", { name: "Pagination" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("catalog-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("navigation", { name: "Pagination" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("catalog-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("owned problems also use URL pagination and the backend total", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("soj.session", JSON.stringify({ accessToken: "fixture-access", refreshToken: "fixture-refresh", user: { id: 7, handle: "test-author", displayName: "test-author", roles: ["author"], permissions: ["problem.create"] }, expiresAt: "2099-01-01T00:00:00Z" }));
  });
  await page.goto("/en/manage/problems?page=2");
  const owned = page.getByRole("region", { name: "Owned problems" });
  await expect(owned.getByRole("link")).toHaveCount(20);
  await expect(owned.getByRole("link").first()).toContainText("Problem 21");
  await expect(owned.getByText("250 total", { exact: true })).toBeVisible();
  await owned.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=3/);
  await expect(owned.getByRole("link").first()).toContainText("Problem 41");
  expect(queries.filter((query) => query.get("mine") === "true").every((query) => ["2", "3"].includes(query.get("page")!))).toBe(true);
});
