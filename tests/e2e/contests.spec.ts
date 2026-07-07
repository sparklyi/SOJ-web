import { expect, test } from "@playwright/test";

test("contest list renders lifecycle and entry links", async ({ page }) => {
  await page.goto("/contests");

  await expect(page.getByRole("heading", { name: "SOJ Signal Cup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contest manifest" })).toBeVisible();
  await expect(page.getByText("OI Calibration Round")).toBeVisible();
  await expect(page.getByLabel("Featured contest").getByText("Running")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible();
});

test("contest detail renders registration state and problems", async ({ page }) => {
  await page.goto("/contests/1");

  await expect(page.getByRole("heading", { name: "SOJ Signal Cup" })).toBeVisible();
  await expect(page.getByLabel("Contest access").getByText("Registered", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signal Path" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open problem A" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Scoreboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Arena/i })).toBeVisible();
});
