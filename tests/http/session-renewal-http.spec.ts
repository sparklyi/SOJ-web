import { expect, test } from "@playwright/test";

// Browser HTTP-path coverage uses intercepted responses; no account writes or
// running backend are needed. Run with playwright.http.config.ts.
test("an expired access token renews the session and keeps the account page available", async ({ page }) => {
  const user = { id: 7, username: "renewed-user", roles: ["user"], permissions: [], status: "active" };
  let refreshes = 0;
  await page.addInitScript(() => {
    if (window.localStorage.getItem("soj.session")) return;
    window.localStorage.setItem("soj.session", JSON.stringify({ accessToken: "old-access", refreshToken: "valid-refresh", user: { id: 7, handle: "old-user", displayName: "old-user", roles: ["user"], permissions: [] }, expiresAt: "2020-01-01T00:00:00Z" }));
  });
  await page.route("**/api/v1/auth/refresh", async (route) => {
    refreshes += 1;
    expect(route.request().postDataJSON()).toEqual({ refresh_token: "valid-refresh" });
    await route.fulfill({ json: { data: { access_token: "renewed-access", refresh_token: "rotated-refresh", expires_in: 900, user }, error: null } });
  });
  await page.route("**/api/v1/me", async (route) => {
    expect(route.request().headers().authorization).toBe("Bearer renewed-access");
    await route.fulfill({ json: { data: user, error: null } });
  });
  await page.goto("/en/settings");
  await expect(page.getByRole("button", { name: "Open account menu for renewed-user" })).toBeVisible();
  await expect(page.getByText("renewed-user", { exact: true }).first()).toBeVisible();
  expect(refreshes).toBe(1);
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem("soj.session")!).refreshToken)).toBe("rotated-refresh");
  await page.screenshot({ path: test.info().outputPath("session-renewed.png") });
  await page.reload();
  await expect(page.getByRole("button", { name: "Open account menu for renewed-user" })).toBeVisible();
  expect(refreshes).toBe(1);
});

test("a revoked refresh token clears the session and shows login", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("soj.session", JSON.stringify({ accessToken: "expired-access", refreshToken: "revoked-refresh", user: { id: 7, handle: "old-user", displayName: "old-user", roles: ["user"], permissions: [] }, expiresAt: "2020-01-01T00:00:00Z" }));
  });
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({ status: 401, json: { data: null, error: { code: "auth.invalid_refresh_token", message: "Invalid refresh token" } } }));
  await page.goto("/en/settings");
  await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("soj.session"))).toBeNull();
});
