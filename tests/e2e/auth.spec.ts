import { expect, test } from "@playwright/test";

test("login page renders account session form", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("register page validates the new account contract", async ({ page }) => {
  await page.goto("/auth/register");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.getByLabel("Email").fill("lin@example.com");
  await page.getByLabel("Username").fill("lin-chen");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
});

test("anonymous account pages do not expose a fixture user", async ({ page }) => {
  await page.goto("/me");
  // 未登录：右上角是登录 / 注册出口，账号菜单不存在。
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(page.getByText("Lin Chen")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open guest menu" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Author" })).toHaveCount(0);
});

test("account pages render after a valid mock session is saved", async ({ page }) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem("soj.session", JSON.stringify(session));
  }, {
    accessToken: "e2e-access-token",
    refreshToken: "e2e-refresh-token",
    user: {
      id: 7,
      handle: "lin-chen",
      displayName: "Lin Chen",
      roles: ["user"],
      permissions: ["problem.read", "submission.create", "submission.read_own", "contest.join"],
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Lin Chen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Author" })).toHaveCount(0);

  await page.goto("/settings");
  await expect(page.getByLabel("Handle")).toHaveValue("lin-chen");
});

test("expired sessions are cleared before account UI is shown", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "soj.session",
      JSON.stringify({
        accessToken: "expired-access-token",
        refreshToken: "expired-refresh-token",
        user: {
          id: 7,
          handle: "lin-chen",
          displayName: "Lin Chen",
          roles: ["user"],
          permissions: ["problem.read", "submission.create", "submission.read_own", "contest.join"],
        },
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    );
  });

  await page.goto("/");
  // 过期会话清理后，导航回到「未登录」形态：登录 / 注册出口，无访客菜单。
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open guest menu" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Author" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("soj.session"))).toBeNull();
});
