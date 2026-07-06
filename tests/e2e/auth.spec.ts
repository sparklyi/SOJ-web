import { expect, test } from "@playwright/test";

test("login page supports mock session flow", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Handle").fill("lin-chen");
  await page.getByLabel("Password").fill("mock-password");
  await page.getByRole("button", { name: "Enter session" }).click();
  await expect(page.getByText("Mock session ready")).toBeVisible();
});

test("account pages render with mock user", async ({ page }) => {
  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Lin Chen" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByLabel("Handle")).toHaveValue("lin-chen");
});
