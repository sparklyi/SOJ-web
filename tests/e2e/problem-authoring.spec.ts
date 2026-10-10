import { expect, test } from "@playwright/test";

test("author creates, validates, and submits a problem for review", async ({ page }) => {
  await injectAuthor(page);

  await page.goto("/manage/problems");

  await expect(page.getByRole("heading", { name: "Problem authoring" })).toBeVisible();
  await page.getByRole("link", { name: "New problem" }).click();
  await expect(page).toHaveURL(/\/manage\/problems\/new$/);
  await expect(page.getByText("Step 1 of 5 · 5 remaining")).toBeVisible();
  // 标题只在建题这一步出现，之后由 problem.title 承载。
  await expect(page.getByLabel("Title")).toHaveCount(1);

  await page.getByLabel("Title").fill("Author Flow");
  await page.getByRole("button", { name: "Create and continue" }).click();
  await expect(page).toHaveURL(/\/manage\/problems\/\d+\?step=statement$/);
  await expect(page.getByText("Step 2 of 5 · 4 remaining")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveCount(0);

  await page.getByLabel("Description", { exact: true }).fill("Return the input value.");
  await page.getByLabel("Input description").fill("One integer.");
  await page.getByLabel("Output description").fill("The same integer.");
  await page.getByLabel("Sample 1 input").fill("1");
  await page.getByLabel("Sample 1 output").fill("1");
  await page.getByRole("button", { name: "Save statement" }).click();
  await expect(page.getByText("Statement version saved.")).toBeVisible();

  await page.getByRole("button", { name: "Test data" }).click();
  await expect(page).toHaveURL(/\?step=testcase$/);
  // 用例数由后端解析压缩包得出，界面上没有数量输入。
  await expect(page.getByLabel("Case count")).toHaveCount(0);

  // 模板是仓库静态资源，可下载且确实是 zip（PK 魔数）。
  await expect(page.getByRole("link", { name: "Download template" })).toHaveAttribute("href", "/examples/testcases.zip");
  const template = await page.request.get("/examples/testcases.zip");
  expect(template.status()).toBe(200);
  expect((await template.body()).subarray(0, 2).toString("ascii")).toBe("PK");

  await page.getByLabel("Archive", { exact: true }).setInputFiles({ name: "invalid.zip", mimeType: "application/zip", buffer: Buffer.from("not a real archive") });
  await page.getByRole("button", { name: "Upload archive" }).click();
  await expect(page.getByText("3.in has no matching output.")).toBeVisible();

  await page.getByLabel("Archive", { exact: true }).setInputFiles({ name: "testcases.zip", mimeType: "application/zip", buffer: Buffer.from("mock zip") });
  await page.getByRole("button", { name: "Upload archive" }).click();
  await expect(page.getByText("Testcase archive uploaded.")).toBeVisible();
  await expect(page.getByText("Parsed 2 cases.")).toBeVisible();

  await page.getByRole("button", { name: "Validation" }).click();
  await expect(page).toHaveURL(/\?step=check$/);
  await page.getByRole("button", { name: "Run validation" }).click();
  await expect(page.getByText("The current versions passed validation.")).toBeVisible();

  await page.getByRole("button", { name: "Review" }).click();
  await expect(page).toHaveURL(/\?step=review$/);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Problem submitted for review.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Review in progress" })).toBeDisabled();
});

test("ordinary user sees the authoring 403 state without a create entry", async ({ page }) => {
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
      permissions: [],
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  await page.goto("/manage/problems");

  await expect(page.getByRole("heading", { name: "Problem authoring" })).toBeVisible();
  await expect(page.getByText("Problem authoring access is required.")).toBeVisible();
  await expect(page.getByRole("link", { name: "New problem" })).toHaveCount(0);
});

test("an existing problem never opens an empty create step", async ({ page }) => {
  await injectAuthor(page);

  // 建题步只属于 /manage/problems/new；编辑态的 ?step=create（手写深链或点 stepper）
  // 必须归一到题面，而不是渲染一个没有操作的空白面板。
  await page.goto("/manage/problems/1?step=create");

  await expect(page.getByLabel("Description", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save statement" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveCount(0);
});

test("statement previews unsaved LaTeX, reports errors and preserves saved source", async ({ page }) => {
  await injectAuthor(page);
  await page.goto("/en/manage/problems/1?step=statement");
  const preview = page.getByRole("complementary", { name: "Live preview" });
  const source = String.raw`For $n < 10$ return **the sum**.

$$\begin{pmatrix}1 & 2 \\ 3 & 4\end{pmatrix}$$`;
  await page.getByLabel("Description", { exact: true }).fill(source);
  await page.getByLabel("Input description").fill("One integer $n$.");
  await page.getByLabel("Output description").fill("Print $n + 1$.");
  await page.getByLabel("Sample 1 input").fill("$literal$\n<img src=x>");
  await page.getByLabel("Sample 1 output").fill("2");
  await page.getByLabel("Sample 1 explanation").fill("Because $1 + 1 = 2$.");
  await expect(preview.locator(".katex")).toHaveCount(5);
  await expect(preview.locator(".katex-display")).toHaveCount(1);
  await expect(preview.locator(".katex-error")).toHaveCount(0);
  await expect(preview.locator("pre").first()).toHaveText("$literal$\n<img src=x>");
  await expect(preview.locator("img")).toHaveCount(0);
  const editorBox = await page.getByLabel("Description", { exact: true }).boundingBox();
  const previewBox = await preview.boundingBox();
  expect(editorBox!.x + editorBox!.width).toBeLessThanOrEqual(previewBox!.x);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  const pinnedBox = await preview.boundingBox();
  expect(pinnedBox!.y).toBeGreaterThanOrEqual(68);
  expect(pinnedBox!.y).toBeLessThanOrEqual(100);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: test.info().outputPath("statement-preview-desktop.png") });

  await page.getByLabel("Description", { exact: true }).fill(String.raw`$\frac{1}{$`);
  await expect(preview.getByText(/Formula error:/)).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("statement-preview-error.png") });
  await page.getByLabel("Description", { exact: true }).fill(source);
  await expect(preview.getByText(/Formula error:/)).toHaveCount(0);
  await page.getByRole("button", { name: "Save statement" }).click();
  await expect(page.getByText("Statement version saved.")).toBeVisible();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(source);
});

test("Chinese statement preview stacks on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await injectAuthor(page);
  await page.goto("/zh-CN/manage/problems/1?step=statement");
  const preview = page.getByRole("complementary", { name: "实时预览" });
  await page.getByLabel("描述", { exact: true }).fill(String.raw`当 $n < 10$ 时，计算 $\frac{n(n+1)}{2}$。`);
  await expect(preview.locator(".katex")).toHaveCount(2);
  const editorBox = await page.getByLabel("描述", { exact: true }).boundingBox();
  const previewBox = await preview.boundingBox();
  expect(previewBox!.y).toBeGreaterThan(editorBox!.y + editorBox!.height);
  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("statement-preview-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

async function injectAuthor(page: import("@playwright/test").Page) {
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
      permissions: ["problem.create", "problem.edit_own", "problem.submit_review"],
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
}
