import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const templateArchive = join(process.cwd(), "public", "examples", "testcases.zip");

test("real backend parses the template archive and gates review on a passing check", async ({ page }) => {
  const run = Date.now();
  const broken = brokenArchive();

  try {
    await page.goto("/auth/register");
    await page.getByLabel("Email").fill(`http-author-${run}@example.com`);
    await page.getByLabel("Username").fill(`http-author-${run}`);
    await page.getByLabel("Password").fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/me$/);

    await page.goto("/manage/problems");
    await page.getByRole("link", { name: "New problem" }).click();
    await expect(page).toHaveURL(/\/manage\/problems\/new$/);
    await page.getByLabel("Title").fill("HTTP Author Flow");
    await page.getByRole("button", { name: "Create and continue" }).click();
    await expect(page).toHaveURL(/\/manage\/problems\/\d+\?step=statement$/);
    const problemId = Number(new URL(page.url()).pathname.split("/").at(-1));

    await page.getByLabel("Description", { exact: true }).fill("Return the sum of two integers.");
    await page.getByLabel("Input description").fill("Two integers.");
    await page.getByLabel("Output description").fill("Their sum.");
    await page.getByLabel("Sample 1 input").fill("1 1");
    await page.getByLabel("Sample 1 output").fill("2");
    await page.getByRole("button", { name: "Save statement" }).click();
    await expect(page.getByText("Statement version saved.")).toBeVisible();

    const blocked = await attemptDirectPublication(page, problemId);
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe("problem.check_required");

    await page.getByRole("button", { name: "Test data" }).click();
    // 用例数由后端解析，界面上没有数量输入。
    await expect(page.getByLabel("Case count")).toHaveCount(0);

    await page.getByLabel("Archive", { exact: true }).setInputFiles(broken.path);
    await page.getByRole("button", { name: "Upload archive" }).click();
    await expect(page.getByText("3.in has no matching output.")).toBeVisible();

    expect(existsSync(templateArchive)).toBe(true);
    await page.getByLabel("Archive", { exact: true }).setInputFiles(templateArchive);
    await page.getByRole("button", { name: "Upload archive" }).click();
    await expect(page.getByText("Testcase archive uploaded.")).toBeVisible();
    await expect(page.getByText("Parsed 2 cases.")).toBeVisible();

    await page.getByRole("button", { name: "Validation" }).click();
    await page.getByRole("button", { name: "Run validation" }).click();
    await expect(page.getByText("The current versions passed validation.")).toBeVisible();

    await page.getByRole("button", { name: "Review" }).click();
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Problem submitted for review.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Review in progress" })).toBeDisabled();
  } finally {
    rmSync(broken.dir, { recursive: true, force: true });
  }
});

async function attemptDirectPublication(page: import("@playwright/test").Page, problemId: number) {
  return page.evaluate(async (id) => {
    const session = JSON.parse(window.localStorage.getItem("soj.session") ?? "null") as { accessToken: string };
    const response = await fetch(`/soj-api/api/v1/problems/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    return { status: response.status, body: await response.json() };
  }, problemId);
}

/** 只含 `3.in`、缺 `3.ans` 的坏包：后端应在 details.findings 里点名这个文件。 */
function brokenArchive() {
  const dir = mkdtempSync(join(tmpdir(), "soj-http-authoring-"));
  writeFileSync(join(dir, "3.in"), "1 2\n");
  execFileSync("zip", ["-q", "broken.zip", "3.in"], { cwd: dir });
  return { dir, path: join(dir, "broken.zip") };
}
