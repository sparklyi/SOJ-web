import { expect, test } from "@playwright/test";

test("contest list renders lifecycle and entry links", async ({ page }) => {
  await page.goto("/contests");

  await expect(page.getByRole("heading", { name: "Contests" })).toBeVisible();
  await expect(page.getByText("SOJ Signal Cup")).toBeVisible();
  await expect(page.getByText("OI Calibration Round")).toBeVisible();
  await expect(page.getByText("Running")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open SOJ Signal Cup/i })).toBeVisible();
});

test("contest detail renders registration state and problems", async ({ page }) => {
  await page.goto("/contests/1");

  await expect(page.getByRole("heading", { name: "SOJ Signal Cup" })).toBeVisible();
  await expect(page.getByLabel("Contest access").getByText("Registered", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Signal Path 1" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Scoreboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Arena/i })).toBeVisible();
});
