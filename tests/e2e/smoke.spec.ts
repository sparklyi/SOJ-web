import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  // 这条断言 2026-09-20 改过：h1 原来是精确的「SOJ」，
  // 现在它是**品牌锁定式**（站名 + 品类词），无障碍名因此是「SOJ Online judge」。
  // 被测对象变了，断言跟着变——用正则钉住「站名打头」，而不是钉住整串名字，
  // 品类词的措辞属于文案，不该让冒烟测试跟着红。
  await expect(page.getByRole("heading", { name: /^SOJ/ })).toBeVisible();
});
