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

test("account pages render with mock user", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Lin Chen" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByLabel("Handle")).toHaveValue("lin-chen");
});
