import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  // 这条断言改过两次，两次都是被测对象变了、断言跟着变：
  //   2026-09-20 —— h1 从精确的「SOJ」改成**品牌锁定式**（站名 + 品类词），
  //                 无障碍名因此成了「SOJ Online judge」。
  //   2026-09-23 —— 站名由 SOJ 改为 Sundial，锁定式短暂变成过**双语名**
  //                 （「Sundial 日晷 在线测评平台」），当天即撤回：汉字与拉丁字标
  //                 同字号下视觉高度差 25%，并排读成两个字标。现在两个语种都是
  //                 「Sundial …」打头，中文名只出现在正文与页脚。
  // 正则仍然只钉「站名打头」：品类词的措辞属于文案，
  // 不该让冒烟测试跟着红。
  await expect(page.getByRole("heading", { name: /^Sundial/ })).toBeVisible();
});
