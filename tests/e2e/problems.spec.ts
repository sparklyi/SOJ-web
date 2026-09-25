import { expect, test } from "@playwright/test";

test("problem list is public and renders filters and data rows", async ({ page }) => {
  // 题库是公共资产：匿名访客就该看到列表，不再有登录墙。
  await page.goto("/problems");

  await expect(page.getByRole("heading", { name: "Problem set" })).toBeVisible();
  await expect(page.getByLabel("Search problems")).toBeVisible();
  // 难度筛选从下拉框改成了带计数的按钮组：按钮上的数字就是难度分布，
  // 点它即筛选。契约因此从 combobox 换成 group + button，这里跟着改。
  await expect(page.getByRole("group", { name: "Difficulty" }).getByRole("button", { name: /Easy/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Tag" })).toBeVisible();

  await expect(page.getByRole("link", { name: /Shortest Path/i })).toBeVisible();
  await expect(page.getByRole("table").getByText("graphs")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Acceptance" })).toBeVisible();
});

test("problem detail is public and renders statement and submit rail", async ({ page }) => {
  await page.goto("/problems/1");

  await expect(page.getByRole("heading", { name: "Shortest Path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Statement" })).toBeVisible();
  await expect(page.getByText("在带权有向图中")).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Input" })).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Output" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Examples" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Constraints" })).toBeVisible();
  // 提交侧栏对匿名访客也在，但两个动作是禁用的、转成登录引导。
  await expect(page.getByRole("heading", { name: "Code workspace" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Custom input", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset to default code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in to run" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign in to submit" })).toBeDisabled();
});
