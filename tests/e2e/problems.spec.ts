import { expect, test } from "@playwright/test";

test("problem list renders search, filters, and data rows", async ({ page }) => {
  await page.goto("/problems");

  await expect(page.getByRole("heading", { name: "Problem set" })).toBeVisible();
  await expect(page.getByLabel("Search problems")).toBeVisible();
  // 难度筛选从下拉框改成了带计数的按钮组：按钮上的数字就是难度分布，
  // 点它即筛选。契约因此从 combobox 换成 group + button，这里跟着改。
  await expect(page.getByRole("group", { name: "Difficulty" }).getByRole("button", { name: /Easy/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Tag" })).toBeVisible();

  await expect(page.getByRole("link", { name: /Shortest Path/i })).toBeVisible();
  await expect(page.getByRole("table").getByText("Solved", { exact: true })).toBeVisible();
  await expect(page.getByRole("table").getByText("graphs")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Acceptance" })).toBeVisible();
});

test("problem detail renders statement and submit rail", async ({ page }) => {
  await page.goto("/problems/1");

  await expect(page.getByRole("heading", { name: "Shortest Path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Statement" })).toBeVisible();
  await expect(page.getByText("Find the minimum-cost path between two nodes in a directed weighted graph.")).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Input" })).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Output" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Examples" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Constraints" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit solution" })).toBeVisible();
});
