import { expect, test } from "@playwright/test";

test("problem list renders search, filters, and data rows", async ({ page }) => {
  await page.goto("/problems");

  await expect(page.getByRole("heading", { name: "Problem set" })).toBeVisible();
  await expect(page.getByLabel("Search problems")).toBeVisible();
  await expect(page.locator("form").getByText("Difficulty")).toBeVisible();
  await expect(page.locator("form").getByText("Status")).toBeVisible();
  await expect(page.locator("form").getByText("Tag")).toBeVisible();

  await expect(page.getByRole("link", { name: /Signal Path/i })).toBeVisible();
  await expect(page.getByText("Solved", { exact: true })).toBeVisible();
  await expect(page.getByRole("table").getByText("graphs")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Acceptance" })).toBeVisible();
});

test("problem detail renders statement and submit rail", async ({ page }) => {
  await page.goto("/problems/1");

  await expect(page.getByRole("heading", { name: "Signal Path" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Statement" })).toBeVisible();
  await expect(page.getByText("Find the lowest cost path through a directed signal network.")).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Input" })).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Output" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Examples" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Constraints" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit solution" })).toBeVisible();
});
