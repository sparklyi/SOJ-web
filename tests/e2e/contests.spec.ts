import { expect, test } from "@playwright/test";
import { injectSession } from "./helpers/session";

test("contest list renders lifecycle and entry links", async ({ page }) => {
  // 比赛内容已上登录墙：匿名只会看到登录门，先注入会话。
  await injectSession(page);
  await page.goto("/contests");

  await expect(page.getByRole("heading", { name: "SOJ Weekly Contest" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contest manifest" })).toBeVisible();
  await expect(page.getByText("OI Calibration Round")).toBeVisible();
  await expect(page.getByLabel("Featured contest").getByText("Running")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible();
});

test("contest detail renders registration state and problems", async ({ page }) => {
  await injectSession(page);
  await page.goto("/contests/1");

  await expect(page.getByRole("heading", { name: "SOJ Weekly Contest" })).toBeVisible();
  await expect(page.getByLabel("Contest access").getByText("Registered", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shortest Path" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open problem A" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Scoreboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Arena/i })).toBeVisible();
});
