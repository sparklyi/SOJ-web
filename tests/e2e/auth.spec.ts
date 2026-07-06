import { expect, test } from "@playwright/test";

test("login page renders mock session form", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Handle")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter session" })).toBeVisible();
});

test("account pages render with mock user", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Lin Chen" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByLabel("Handle")).toHaveValue("lin-chen");
});
