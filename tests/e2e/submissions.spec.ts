import { expect, test } from "@playwright/test";

test("submission list renders judge rows and verdict states", async ({ page }) => {
  await page.goto("/submissions");

  await expect(page.getByRole("heading", { name: "Submissions" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Submission queue" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "#4" })).toContainText("Accepted");
  await expect(page.getByRole("row").filter({ hasText: "#5" })).toContainText("Wrong Answer");
  await expect(page.getByRole("row").filter({ hasText: "#7" })).toContainText("Compile Error");
  await expect(page.getByRole("row").filter({ hasText: "#8" })).toContainText("System Error");
  await expect(page.getByText("Sundial Weekly Contest").first()).toBeVisible();
  // 耗时/内存走 lib/ui/number 的唯一实现：42 ms 不足一秒原样给毫秒，
  // 8192 KB 折成读者单位 8 MB（此前这里直接拼 `${value} KB`）。
  await expect(page.getByText("42 ms").first()).toBeVisible();
  await expect(page.getByText("8 MB").first()).toBeVisible();
});

test("submission detail renders lifecycle feedback and contest impact", async ({ page }) => {
  await page.goto("/submissions/5");

  await expect(page.getByRole("heading", { name: "Submission #5" })).toBeVisible();
  await expect(page.getByText("Wrong Answer").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Judge lifecycle" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Test point matrix" })).toBeVisible();
  await expect(page.getByText("#1")).toBeVisible();
  await expect(page.getByText("#8")).toBeVisible();
  await expect(page.getByRole("region", { name: "Runtime and system information" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Runtime and system information" }).getByText("Mismatch at point 4")).toBeVisible();
  await expect(page.getByRole("region", { name: "Contest impact" })).toBeVisible();
  await expect(page.getByText("Penalty risk")).toBeVisible();
  await expect(page.getByText("+20 min")).toBeVisible();
});
