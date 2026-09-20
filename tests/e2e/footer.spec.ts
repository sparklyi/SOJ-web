import { expect, test } from "@playwright/test";

/**
 * 站点页脚契约。
 *
 * 「所有页面都有页脚」不是靠逐页加出来的，是挂在根布局上（SiteFooter）；
 * 但这条契约要防的恰恰是**它悄悄消失**：有人把页面改成自定义布局、
 * 有人往页脚里塞了假入口、有人把两个真实链接改成了别的。
 *
 * 所以这里测的不是「首页有页脚」，而是**每一族页面都有**——
 * 按环境层的档位选代表路由（展台 / 列表 / 阅读 / 鉴权），
 * 任何一族漏了页脚，根布局挂载这条链路就断在某处了。
 */

const ROUTES = ["/", "/problems", "/problems/1", "/auth/login", "/contests"];

test("every page family carries the site footer", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);

    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer, `${route} 上找不到页脚地标`).toBeVisible();

    // 版权句。用正则钉「© + 年份 + SOJ」，不钉整句——措辞属于文案。
    await expect(footer.getByText(/©\s*\d{4}\s*SOJ/)).toBeVisible();

    // 页脚只放真实落点：仓库与 issue 各一条，不许多也不许少。
    // 「关于我们」「服务条款」这类没有页面的链接，比缺一个页脚糟得多。
    const links = footer.getByRole("link");
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute(
      "href",
      "https://github.com/sparklyi/SOJ-web",
    );
    await expect(links.nth(1)).toHaveAttribute(
      "href",
      "https://github.com/sparklyi/SOJ-web/issues",
    );
  }
});
