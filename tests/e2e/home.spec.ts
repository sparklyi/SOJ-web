import { expect, test, type Locator } from "@playwright/test";

/**
 * 首页契约。
 *
 * 首页是**展台**：陈述这个站是什么、有多大，然后把人送进产品。
 * 它不是数据入口，不是产品说明书，也不是站内数据的目录。
 *
 * 本文件 2026-09-20 第三次重写（首页从「展台 + 构成铭牌 + 加入我们」三块
 * 收成「展台 + 加入我们」两块，字标从自绘 SVG 改成排字锁定式，
 * 加入我们改居中并去掉页签）。相对上一版**改掉的断言**：
 *   · 删掉：构成铭牌那一段的三条断言（难度构成 / 支持语言 / 专题）。
 *     被测对象整块不存在了。
 *   · 删掉：铭牌上「Contests」这一条 —— 比赛场次不再显示。
 *   · 改掉：加入我们原来是「页签 + 一张表单」，现在是「页脚切换」，
 *     所以 `getByRole("tab", …)` 换成页脚按钮；并新增两条几何断言
 *     （居中）与一条文本断言（全大写）。
 * 这些都在当面向用户说明过，不是把旧断言偷偷改绿。
 */

test("the homepage is a plinth, not a catalogue of other pages", async ({ page }) => {
  await page.goto("/");

  // 锁定式：站名 + 品类词。读者不用滚动就该知道这是什么站。
  await expect(page.getByRole("heading", { name: /SOJ/ })).toBeVisible();

  // 主导航只放「场所」。
  const primaryNav = page.getByRole("navigation", { name: "Primary" });
  await expect(primaryNav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(primaryNav.getByRole("link", { name: "Problems" })).toBeVisible();
  await expect(primaryNav.getByRole("link", { name: "Contests" })).toBeVisible();
  // 「我的提交」是**我的**东西，收在账号菜单里；未登录时主导航里不该有它。
  await expect(primaryNav.getByRole("link", { name: "My submissions" })).toHaveCount(0);

  // 铭牌：站级数字回答「这站有多大、我用得上吗」，并只给一个出口。
  const plinth = page.getByRole("region", { name: /SOJ/ });
  await expect(plinth.getByText("Problems", { exact: true })).toBeVisible();
  await expect(plinth.getByText("Submissions", { exact: true })).toBeVisible();
  await expect(plinth.getByText("Languages", { exact: true })).toBeVisible();
  await expect(plinth.getByRole("link", { name: "Explore problems" })).toHaveAttribute(
    "href",
    /\/problems$/,
  );
});

test("the join block is centred, uppercase, and opens the auth dialog in place", async ({ page }) => {
  await page.goto("/");

  const join = page.getByRole("region", { name: "Join us" });

  // 显示词必须是全大写。它曾经是「Join us」（首字母大写），
  // 在高字号下小写字母会被 x-height 拉得软塌，而且和上下两句陈述句分不开。
  const invite = join.locator("button > span").last();
  await expect(invite).toHaveText("JOIN US");

  // 居中。左对齐改成居中是构图改动，靠肉眼看缩略图分不出差 3px 的偏心，
  // 所以这里直接量：显示词的中心与所在区块的中心之差。
  const offset = await join.evaluate((section) => {
    const word = section.querySelector("button > span:last-of-type") as HTMLElement | null;
    if (!word) return null;
    const s = section.getBoundingClientRect();
    const w = word.getBoundingClientRect();
    return Math.round(w.left + w.width / 2 - (s.left + s.width / 2));
  });
  expect(Math.abs(offset ?? 999), `加入我们的居中偏差 ${offset}px`).toBeLessThanOrEqual(2);

  // 点击开弹窗，而不是切走。
  await join.getByRole("button", { name: /JOIN US/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // 它是**就地开弹窗**，不是页面切换——旧版是跳到 /auth/register。
  await expect(page).not.toHaveURL(/\/auth\//);

  // 默认落在注册：注册比登录多一个用户名字段，标题也该跟着变。
  await expect(dialog.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(dialog.getByLabel("Username")).toBeVisible();
  await expect(dialog.getByLabel("Email")).toBeVisible();
  await expect(dialog.getByLabel("Password")).toBeVisible();

  // 页脚切换：注册 → 登录。用户名字段应当消失，而不是留一个用不上的输入框。
  await dialog.getByRole("button", { name: "Login", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Login", exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Username")).toHaveCount(0);
  // 页脚翻到另一侧：现在它提供的是「注册」。
  await expect(dialog.getByRole("button", { name: "Register", exact: true })).toBeVisible();

  // **弹窗必须有一条看得见的出路。** Radix 只保证 Esc 与点击遮罩能关，
  // 不渲染任何可见的关闭控件——少了它，触屏上就没有退出路径（那里没有 Esc）。
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
});

/**
 * 可读性护栏。
 *
 * 判据不是「字号够不够大」，而是**对比度**——首页上一轮的问题恰恰不是字号，
 * 是颜色：10px 的标签配了最弱那级灰（96,106,122），在曜石底上只有 3.62:1。
 * 字号小一点还能读，颜色贴到背景上就真的看不见了。
 *
 * 这里直接按 WCAG 2.1 算比值，并且**从计算样式里取真实颜色**，
 * 而不是断言某个 token 的名字——调色板改名字不该让护栏失效，改坏了颜色才该。
 */
async function labelReadability(locator: Locator) {
  return locator.evaluate((el) => {
    const toRgb = (value: string) =>
      (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (rgb: number[]) => {
      const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    };

    const foreground = toRgb(getComputedStyle(el).color);
    // 首页的标签直接坐在页面底色上（这一页没有面板），所以取根元素的背景即可。
    const background = toRgb(getComputedStyle(document.documentElement).backgroundColor);
    const [hi, lo] =
      luminance(foreground) > luminance(background)
        ? [luminance(foreground), luminance(background)]
        : [luminance(background), luminance(foreground)];

    return {
      ratio: (hi + 0.05) / (lo + 0.05),
      size: Number.parseFloat(getComputedStyle(el).fontSize),
    };
  });
}

test("the homepage labels stay above the readability line", async ({ page }) => {
  await page.goto("/");

  const plinth = page.getByRole("region", { name: /SOJ/ });
  const join = page.getByRole("region", { name: "Join us" });

  // 铭牌上的三个标签 + 收束句 + 出口链接：这些字都不大，
  // 而它们恰恰是「说明那些大数字是什么」「点了会去哪」的字。
  const labels: Array<[string, Locator]> = [
    ["Problems", plinth.getByText("Problems", { exact: true })],
    ["Submissions", plinth.getByText("Submissions", { exact: true })],
    ["Languages (plinth)", plinth.getByText("Languages", { exact: true })],
    ["statement", join.getByText("Think in algorithms. Prove every answer.")],
    ["explore link", plinth.getByRole("link", { name: "Explore problems" })],
  ];

  for (const [name, locator] of labels) {
    const { ratio, size } = await labelReadability(locator);
    expect(ratio, `「${name}」的对比度只有 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    expect(size, `「${name}」的字号只有 ${size}px`).toBeGreaterThanOrEqual(13);
  }
});

/**
 * 回归护栏：首页不做「目录」、不讲「常识」、也不摆「清单」。
 *
 * 这三类内容都是更早一版或上一版的病灶，而且都很容易被重新搬回来——
 * 一段「提交 → 编译 → 跑测试点 → 出判定」看起来永远像是「有用的信息」，
 * 一份「推荐题目」看起来永远像是「内容丰富的首页」，
 * 一排「C++17 / Go 1.24 / bitmask」看起来永远像是「让页面显得有内容」。
 *
 * 判据写在这里：
 *   · 一块内容拿掉之后用户还能从导航去到同一处，它就是导航的重复；
 *   · 一句在教读者刷题站怎么用的话，就是把读者当外行；
 *   · 一份「具体有哪些」的清单，属于题库页，不属于首页——首页只说尺度（几个数）。
 */
test("the homepage does not re-add directories, tutorials, or data listings", async ({ page }) => {
  await page.goto("/");

  const plinth = page.getByRole("region", { name: /SOJ/ });

  const removedRegions = [
    // 别页的副本：题库样张、焦点比赛、推荐题目。
    "Inside the problem set",
    "Featured contest",
    "Recommended problems",
    // 面向外行的说明文：判题流程、三步开始、能力清单。
    "How a submission is judged",
    "Start in three steps",
    "What you get",
    // 具体清单：难度构成 / 支持语言 / 专题。整块陈列已经撤掉。
    "Site composition",
  ];

  for (const name of removedRegions) {
    await expect(page.getByRole("region", { name })).toHaveCount(0);
  }

  // 同一条约束落回文本层：连这些标题与标签本身都不该出现在页面上。
  const removedText = ["Per-test-case judging", "Browse the full set", "sample run", "Difficulty mix", "Topics"];

  for (const text of removedText) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }

  // 比赛场次必须在**铭牌范围内**查：主导航里本来就有「比赛」这个入口，
  // 全页查会命中导航，那测的就不是这件事了。
  await expect(plinth.getByText("Contests", { exact: true })).toHaveCount(0);
});

/**
 * 回归护栏：判题结果是**私有的**。
 *
 * 首页曾经挂过一份「全站最新评测」列表。那不是排版问题，是把别人的判题结果公开了——
 * 所以这里不是断言「某段不见了」，而是断言首页上**不存在任何全站提交流水**。
 * 这条如果红了，说明有人又把判题结果当成展示素材搬了回来。
 */
test("the homepage never exposes a site-wide verdict feed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recent verdicts" })).toHaveCount(0);
  await expect(page.getByRole("table", { name: "Submission queue" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Recent verdicts" })).toHaveCount(0);
});
