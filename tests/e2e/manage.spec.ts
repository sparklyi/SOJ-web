import { expect, test, type Page } from "@playwright/test";
import { injectSession } from "./helpers/session";

async function injectAuthor(page: Page) {
  await injectSession(page, { roles: ["user", "author"], permissions: ["problem.create", "problem.edit_own", "problem.submit_review"] });
}

test("workbench landing filters cards and collapses the navigation entries", async ({ page }) => {
  await injectAuthor(page);
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("link", { name: "Workbench" })).toBeVisible();
  // 出题 / 审核 / 重测不再是独立导航项。
  await expect(nav.getByRole("link", { name: "Author" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Review" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Rejudge" })).toHaveCount(0);

  await nav.getByRole("link", { name: "Workbench" }).click();
  await expect(page).toHaveURL(/\/manage$/);
  await expect(page.getByRole("heading", { name: "Workbench" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Authoring/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Review/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Rejudge/ })).toHaveCount(0);
});

test("a reviewer sees the authoring and review cards, not rejudge", async ({ page }) => {
  await injectSession(page, { roles: ["user", "reviewer"], permissions: ["problem.review", "problem.publish"] });
  await page.goto("/manage");

  await expect(page.getByRole("link", { name: /Review/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Authoring/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Rejudge/ })).toHaveCount(0);
});

test("a plain account gets the 403 wall and no workbench entry", async ({ page }) => {
  await injectSession(page, { roles: ["user"], permissions: [] });
  await page.goto("/manage");

  await expect(page.getByText("403 · Permission required")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Workbench" })).toHaveCount(0);
});
