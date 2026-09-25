import { expect, test } from "@playwright/test";
import { injectSession } from "./helpers/session";

/**
 * 练习场是「入口」而不是「内容详情」，所以前两个用例**故意**不注入会话：
 * 匿名访客必须能打开页面、看到语言目录、在编辑器里写字。
 * 只有「运行」需要登录，输出面板因此给出登录空态。
 */
test("playground opens for a visitor and seeds a starter template", async ({ page }) => {
  await page.goto("/playground");

  await expect(page.getByRole("heading", { name: "Playground", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Code workspace" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Language", exact: true })).toBeVisible();
  await expect(page.getByLabel("Custom input")).toBeVisible();

  // 编辑器不是空的：CodeWorkspace 会种入当前语言的起始模板。
  await expect(page.getByLabel("Source code")).toContainText("#include <bits/stdc++.h>");

  // 未登录能看到编辑器，但运行需要登录：输出面板是登录空态，不是「还没运行」。
  await expect(page.getByRole("region", { name: "Output" })).toBeVisible();
  await expect(page.getByText("Sign in to run code and see the output.")).toBeVisible();
});

test("playground is reachable from the primary navigation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Playground" }).click();

  await expect(page).toHaveURL(/\/playground$/);
  await expect(page.getByRole("heading", { name: "Playground", level: 1 })).toBeVisible();
});

test("playground runs without a problem and shows the output", async ({ page }) => {
  await injectSession(page);
  await page.goto("/playground");

  await page.getByLabel("Custom input").fill("7 8");
  await page.getByRole("button", { name: "Run" }).click();

  // mock 夹具回显 stdin：输入到输出这条链路端到端可见。
  await expect(page.getByRole("region", { name: "Output" }).getByText("7 8")).toBeVisible();
});

test("playground keeps a draft across a reload", async ({ page }) => {
  await page.goto("/playground");

  // 编辑器是 CodeMirror 的 contenteditable，用 stdin 文本框走同一条草稿链路，
  // 断言更稳，也顺带覆盖了「非源码字段也要存」这件事。
  await page.getByLabel("Custom input").fill("1 2 3");
  // 草稿写入是防抖的，等它落盘再刷新。
  await page.waitForFunction(() => (window.localStorage.getItem("soj.playground.draft.v1") ?? "").includes("1 2 3"));

  await page.reload();

  await expect(page.getByLabel("Custom input")).toHaveValue("1 2 3");
});
