import { expect, test } from "@playwright/test";

test("contest scoreboard renders dense ranking surface", async ({ page }) => {
  await page.goto("/contests/1/scoreboard");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Scoreboard/i })).toBeVisible();
  await expect(page.getByText(/Freeze status/i)).toBeVisible();
  await expect(page.getByText(/Rank movement/i)).toBeVisible();
});
