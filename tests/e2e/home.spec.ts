import { expect, test } from "@playwright/test";

test("homepage exposes the Signal Arena entry surface", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SOJ", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Problems" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Contests" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Live signal panel" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Active contests" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SOJ Signal Cup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recommended problems" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cache Relay" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent judge signals" })).toBeVisible();
  await expect(page.getByText("Accepted").first()).toBeVisible();
});
