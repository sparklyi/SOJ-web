import { expect, test } from "@playwright/test";

test("author creates, validates, and publishes a problem", async ({ page }) => {
  const slug = `author-flow-${Date.now()}`;
  await page.addInitScript((session) => {
    window.localStorage.setItem("soj.session", JSON.stringify(session));
  }, {
    accessToken: "e2e-author-access-token",
    refreshToken: "e2e-author-refresh-token",
    user: {
      id: 7,
      handle: "lin-chen",
      displayName: "Lin Chen",
      roles: ["user", "author"],
      permissions: ["problem.read", "submission.create", "submission.read_own", "contest.join", "problem.create", "problem.edit_own", "problem.testcase.manage_own", "problem.check_own", "problem.submit_review"],
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

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
  await expect(
    page.getByLabel("Validation and publication").getByText("Published", { exact: true }),
  ).toBeVisible();
});

test("ordinary user sees the authoring 403 state without an author entry", async ({ page }) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem("soj.session", JSON.stringify(session));
  }, {
    accessToken: "e2e-user-access-token",
    refreshToken: "e2e-user-refresh-token",
    user: {
      id: 7,
      handle: "lin-chen",
      displayName: "Lin Chen",
      roles: ["user"],
      permissions: ["problem.read", "submission.create", "submission.read_own", "contest.join"],
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  await page.goto("/manage/problems");

  await expect(page.getByRole("heading", { name: "Problem authoring" })).toBeVisible();
  await expect(page.getByText("Problem authoring access is required.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create draft" })).toHaveCount(0);
});
