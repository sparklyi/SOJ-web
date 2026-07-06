import { expect, test } from "@playwright/test";

test("arena renders live big-screen contest signals", async ({ page }) => {
  await page.goto("/contests/1/arena");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Arena/i })).toBeVisible();
  await expect(page.getByText("Freeze countdown", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accepted events" })).toBeVisible();
});
