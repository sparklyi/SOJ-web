import { expect, test } from "@playwright/test";

test("homepage exposes the entry surface", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SOJ", exact: true })).toBeVisible();

  // 主导航只放「场所」：首页 / 题库 / 比赛。
  const primaryNav = page.getByRole("navigation", { name: "Primary" });
  await expect(primaryNav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(primaryNav.getByRole("link", { name: "Problems" })).toBeVisible();
  await expect(primaryNav.getByRole("link", { name: "Contests" })).toBeVisible();
  // 「我的提交」是**我的**东西，收在账号菜单里；未登录时主导航里不该有它。
  await expect(primaryNav.getByRole("link", { name: "My submissions" })).toHaveCount(0);

  // 首屏之下只回答三件事：现在在发生什么 / 我从哪开始 / 别人在做什么。
  await expect(page.getByRole("heading", { name: "Active contests" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SOJ Weekly Contest" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recommended problems" })).toBeVisible();
  // 首页有不止一处指向同一道题（「最近评测」里也有），
  // 所以断言必须限定到「推荐题目」这个具名区域上，否则会命中两个链接。
  await expect(
    page.getByRole("region", { name: "Recommended problems" }).getByRole("link", { name: "Cache Relay" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent verdicts" })).toBeVisible();
  await expect(page.getByText("Accepted").first()).toBeVisible();
});
