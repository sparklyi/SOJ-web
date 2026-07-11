import { expect, test } from "@playwright/test";

test("author creates, validates, and publishes a problem", async ({ page }) => {
  const slug = `author-flow-${Date.now()}`;
  await page.goto("/manage/problems");

  await expect(page.getByRole("heading", { name: "Problem authoring" })).toBeVisible();
  await page.getByLabel("Title").fill("Author Flow");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Tags").fill("math, validation");
  await page.getByRole("button", { name: "Create draft" }).click();

  await expect(page).toHaveURL(/\/manage\/problems\/\d+$/);
  await page.getByLabel("Description", { exact: true }).fill("Return the input value.");
  await page.getByLabel("Input description").fill("One integer.");
  await page.getByLabel("Output description").fill("The same integer.");
  await page.getByLabel("Sample input").fill("1");
  await page.getByLabel("Sample output").fill("1");
  await page.getByRole("button", { name: "Save statement" }).click();
  await expect(page.getByText("Statement version saved.")).toBeVisible();

  await page.getByLabel("Archive").setInputFiles({ name: "cases.zip", mimeType: "application/zip", buffer: Buffer.from("mock zip") });
  await page.getByRole("button", { name: "Upload archive" }).click();
  await expect(page.getByText("Testcase archive uploaded.")).toBeVisible();
  await expect(page.getByText("Run a problem check.")).toBeVisible();

  await page.getByRole("button", { name: "Run validation" }).click();
  await expect(page.getByText("Ready to publish")).toBeVisible();
  await page.getByRole("button", { name: "Publish problem" }).click();
  await expect(page.getByText("Problem published.")).toBeVisible();
  await expect(page.getByText("published", { exact: true })).toBeVisible();
});
