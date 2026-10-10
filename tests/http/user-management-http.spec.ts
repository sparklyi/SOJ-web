import { expect, test, type Page } from "@playwright/test";

// Local intercepted HTTP responses exercise the production adapter and UI.
// No real accounts or backend are modified.
async function fixture(page: Page, options: { failProfileOnce?: boolean; permissions?: string[] } = {}) {
  const permissions = options.permissions ?? ["user.manage"];
  const users = [
    { id: 7, email: "lin@example.com", username: "lin-chen", bio: "", roles: ["user", "admin"], permissions, status: "active", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" },
    { id: 12, email: "aya@example.com", username: "aya-sato", bio: "Existing biography", roles: ["user", "author"], permissions: [], status: "active", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" },
  ];
  const patches: Array<{ id: number; body: Record<string, unknown> }> = [];
  let failProfile = options.failProfileOnce;
  await page.addInitScript(() => {
    window.localStorage.setItem("soj.session", JSON.stringify({ accessToken: "fixture-access", refreshToken: "fixture-refresh", user: { id: 7, handle: "lin-chen", displayName: "lin-chen", roles: ["user", "admin"], permissions: ["user.manage"] }, expiresAt: "2099-01-01T00:00:00Z" }));
  });
  await page.route("**/api/v1/**", async (route) => {
    expect(route.request().headers().authorization).toBe("Bearer fixture-access");
    const url = new URL(route.request().url());
    const path = url.pathname.slice(url.pathname.indexOf("/api/v1/"));
    if (path === "/api/v1/me") {
      await route.fulfill({ json: { data: users[0], error: null } });
      return;
    }
    if (path === "/api/v1/admin/users") {
      let items = users;
      const keyword = url.searchParams.get("keyword")?.toLowerCase();
      if (keyword) items = items.filter((user) => `${user.username} ${user.email}`.toLowerCase().includes(keyword));
      if (url.searchParams.has("status")) items = items.filter((user) => user.status === url.searchParams.get("status"));
      await route.fulfill({ json: { data: { items, total: items.length }, error: null } });
      return;
    }
    const match = path.match(/^\/api\/v1\/admin\/users\/(\d+)$/);
    if (match && route.request().method() === "PATCH") {
      const id = Number(match[1]);
      const body = route.request().postDataJSON();
      patches.push({ id, body });
      if (failProfile && ("username" in body || "bio" in body)) {
        failProfile = false;
        await route.fulfill({ status: 500, json: { data: null, error: { code: "fixture.rejected", message: "Profile update rejected." } } });
        return;
      }
      const user = users.find((item) => item.id === id)!;
      Object.assign(user, body);
      // PATCH does not load global roles in the backend; listing restores them.
      await route.fulfill({ json: { data: { ...user, roles: [] }, error: null } });
      return;
    }
    await route.fulfill({ status: 404, json: { data: null, error: { code: "not_found", message: "Not found" } } });
  });
  return { users, patches };
}

test("a user manager edits and clears a profile, retries failures and controls account status", async ({ page }) => {
  const { patches } = await fixture(page, { failProfileOnce: true });
  await page.goto("/en/admin/users");
  const row = page.getByRole("row").filter({ hasText: "aya@example.com" });
  await row.getByRole("button", { name: "Manage user" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Bio")).toHaveValue("Existing biography");
  await page.screenshot({ path: test.info().outputPath("user-management-desktop.png") });
  await expect(dialog.getByRole("button", { name: "Grant", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Revoke", exact: true })).toHaveCount(0);
  await dialog.getByLabel("Username").fill(" renamed-author ");
  await dialog.getByLabel("Bio").fill("");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Profile update rejected.");
  await expect(dialog.getByLabel("Username")).toHaveValue(" renamed-author ");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog.getByRole("status")).toHaveText("User profile saved.");
  expect(patches).toEqual([{ id: 12, body: { username: "renamed-author", bio: "" } }, { id: 12, body: { username: "renamed-author", bio: "" } }]);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(row.getByText("renamed-author", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: "Manage user" }).click();
  await expect(dialog.getByLabel("Bio")).toHaveValue("");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await row.getByRole("button", { name: "Disable", exact: true }).click();
  await expect(page.getByText("User disabled.", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "Disabled", exact: true }).click();
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await row.getByRole("button", { name: "Enable", exact: true }).click();
  await expect(page.getByText("User enabled.", { exact: true })).toBeVisible();
  await expect(page.getByText("No users match this filter.", { exact: true })).toBeVisible();
});

test("editing your own profile refreshes the account name while self-disable and self-role changes stay blocked", async ({ page }) => {
  const { patches } = await fixture(page, { permissions: ["user.manage", "role.grant", "role.revoke"] });
  await page.goto("/en/admin/users");
  const row = page.getByRole("row").filter({ hasText: "lin@example.com" });
  await expect(row.getByRole("button", { name: "Disable", exact: true })).toBeDisabled();
  await row.getByRole("button", { name: "Manage user" }).click();
  const dialog = page.getByRole("dialog");
  const roleButtons = dialog.getByRole("button", { name: /^(Grant|Revoke)$/ });
  for (const button of await roleButtons.all()) await expect(button).toBeDisabled();
  await dialog.getByLabel("Username").fill("renamed-self");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog.getByRole("button", { name: "Save profile" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open account menu for renamed-self" })).toBeVisible();
  await expect(row.getByText("renamed-self", { exact: true })).toBeVisible();
  expect(patches).toEqual([{ id: 7, body: { username: "renamed-self" } }]);
});

test("Chinese profile editing fits mobile and cancel discards unsaved changes", async ({ page }) => {
  const { patches } = await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh-CN/admin/users");
  const row = page.getByRole("row").filter({ hasText: "aya@example.com" });
  await row.getByRole("button", { name: "管理用户" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("简介")).toHaveValue("Existing biography");
  await page.screenshot({ path: test.info().outputPath("user-management-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await dialog.getByLabel("简介").fill("unsaved biography");
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await row.getByRole("button", { name: "管理用户" }).click();
  await expect(dialog.getByLabel("简介")).toHaveValue("Existing biography");
  expect(patches).toHaveLength(0);
});

test("accounts without user.manage cannot reach the user controls", async ({ page }) => {
  const { patches } = await fixture(page, { permissions: [] });
  await page.goto("/en/admin/users");
  await expect(page.getByText("403 · Permission required", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage user" })).toHaveCount(0);
  expect(patches).toHaveLength(0);
});

test("renaming a filtered user closes the dialog and resetting filters does not reopen it", async ({ page }) => {
  await fixture(page);
  await page.goto("/en/admin/users");
  await page.getByRole("textbox", { name: "Search", exact: true }).fill("aya-sato");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Manage user" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Username").fill("new-author");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("No users match this filter.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("new-author", { exact: true })).toBeVisible();
  await expect(dialog).toHaveCount(0);
});
