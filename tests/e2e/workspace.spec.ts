import { expect, test } from "@playwright/test";

test("contest problem workspace renders solve loop", async ({ page }) => {
  await page.goto("/contests/1/problems/1");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Signal Path$/i })).toBeVisible();
  await expect(page.getByText(/Code workspace/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Judge feedback" })).toBeVisible();
});
