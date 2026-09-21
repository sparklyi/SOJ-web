import { expect, test } from "@playwright/test";
import { injectSession } from "./helpers/session";

/**
 * 全站设计回退锁。
 *
 * 这轮把站内所有页面拉到与首页同一套语言，过程中反复出现同一类退化：
 * **一个已经判死的做法从别处悄悄长回来**。它每次都只在一处、每次都看起来无害，
 * 而肉眼扫一遍页面是发现不了的——所以这里把判据写成可从计算样式复算的断言。
 *
 * 三条判据对应三件曾经被判死的事：
 *
 * 1. **12px 地板。** 全站最小的字曾经是 10px（弱灰 3.62:1），读者原话「只能看到数字」。
 *    修过两轮（10 → 11 → 12），每一轮都在给眉标留例外，而例外就是缝。
 *    现在没有例外清单：任何自带文字、且真的画出来的元素都不低于 12px。
 * 2. **镀铬按钮不回来。** `Button` 的默认变体曾是 `.soj-metal`（垂直渐变 + 顶部白边 +
 *    底部暗边）。它是页面上唯一有立体感的东西，和扁平的排字差着一个时代。
 *    判据取「按钮上有背景渐变」——这是那道立体修饰的可测特征。
 * 3. **歪圆角不回来。** `rounded-[18px_6px_14px_6px]` 这类不对称切角是上一代的装饰习惯，
 *    与 `rounded-2xl/3xl` 一起被判死。判据是「四个角出现三种以上不同取值」：
 *    只圆上边或只圆下边（两种取值）是合法的排版手段，四个角各不相同才是那道切角。
 */

const ROUTES = [
  "/",
  "/problems",
  "/problems/1",
  "/submissions",
  "/submissions/1",
  "/contests",
  "/contests/1",
  "/auth/login",
  "/auth/register",
  "/me",
  "/settings",
  "/style-guide",
];

/**
 * 在页面里跑：返回全部违规项，不在这里判对错——
 * 断言留在测试里，失败时能一次看到全貌而不是第一条就中断。
 */
const COLLECT = () => {
  const violations: { kind: string; detail: string }[] = [];

  const isVisible = (el: Element) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const style = window.getComputedStyle(el);
    return (
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity) > 0.05
    );
  };

  for (const el of Array.from(document.querySelectorAll("body *"))) {
    // 开发模式的浮层（编译指示器、错误遮罩）不是产品的一部分，不参与判定。
    if (el.closest("nextjs-portal")) continue;
    if (!isVisible(el)) continue;

    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const classes = (typeof el.className === "string" ? el.className : "").slice(0, 56);
    const label = `${tag}.${classes}`;

    // 1. 字号地板。只看元素**自己的**文字节点：父容器不该替子元素背锅。
    const ownText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => (node.textContent ?? "").trim())
      .join(" ")
      .trim();
    const fontSize = Number.parseFloat(style.fontSize);
    if (ownText.length > 0 && fontSize < 12) {
      violations.push({
        kind: "micro-type",
        detail: `${label} → ${fontSize}px "${ownText.slice(0, 24)}"`,
      });
    }

    // 2. 镀铬。判据落在按钮本体上：背景图里出现渐变。
    const isAction = tag === "button" || el.getAttribute("role") === "button";
    if (isAction && style.backgroundImage.includes("gradient")) {
      violations.push({
        kind: "bevel",
        detail: `${label} → ${style.backgroundImage.slice(0, 48)}`,
      });
    }

    // 3. 歪圆角。0 与 50% 由 `border-radius` 的简写形式直接排除。
    const radius = style.borderRadius;
    if (radius && radius !== "0px" && radius !== "50%") {
      const corners = radius.split(/\s+/);
      if (new Set(corners).size >= 3) {
        violations.push({ kind: "radius", detail: `${label} → ${radius}` });
      }
    }
  }

  return violations;
};

async function scan(page: import("@playwright/test").Page, kind: string) {
  const found: string[] = [];
  // 题库 / 比赛页已上登录墙，匿名只会看到登录门——注入会话才能扫到真实内容页。
  await injectSession(page);
  for (const route of ROUTES) {
    await page.goto(route);
    const violations = await page.evaluate(COLLECT);
    for (const violation of violations) {
      if (violation.kind === kind) found.push(`${route} — ${violation.detail}`);
    }
  }
  return found;
}

test("no visible text falls below the 12px floor", async ({ page }) => {
  const offenders = await scan(page, "micro-type");
  expect(offenders, offenders.join("\n")).toEqual([]);
});

test("the retired materials do not come back", async ({ page }) => {
  const bevels = await scan(page, "bevel");
  expect(bevels, `镀铬按钮又出现了：\n${bevels.join("\n")}`).toEqual([]);

  const radii = await scan(page, "radius");
  expect(radii, `不对称切角又出现了：\n${radii.join("\n")}`).toEqual([]);
});

/**
 * 「我的状态」的正向契约锁。
 *
 * 状态的颜色铺在**整行**上（problemRowTone），而不是一枚小胶囊——
 * 「哪些题我做过了」是扫整列的问题，不是逐格找色块的问题。
 * 这条锁防的是两类回退：
 *   1. 有人把行染色删掉、退回「只有状态列一个彩色小点」——三行底色就会变成同一种；
 *   2. 有人给「未开始」也刷上底色——默认态一染色，整张表就全有底，信号即消失。
 */
test("my status tints the whole row, and the default state stays un-tinted", async ({ page }) => {
  await injectSession(page);
  await page.goto("/problems");

  const tintOf = (statusWord: string) =>
    page
      .getByRole("table")
      .locator("tbody tr")
      .filter({ hasText: statusWord })
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);

  const solved = await tintOf("Solved");
  const attempted = await tintOf("Attempted");
  const untouched = await tintOf("Not started");

  // 未开始是默认态：不染色。染色本身就是「我对它做过什么」的信号。
  expect(untouched, "未开始的行不该有底色——默认态一染色，整张表就全有底了").toBe("rgba(0, 0, 0, 0)");
  // 三种状态三种底：扫一遍行就知道哪些做过、哪些试过。
  expect(
    new Set([solved, attempted, untouched]).size,
    `三种状态的行底色应该互不相同，实际：solved=${solved} attempted=${attempted} untouched=${untouched}`,
  ).toBe(3);
});
