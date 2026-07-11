import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("real backend enforces validation before publishing and accepts the published problem", async ({ page }) => {
  const run = Date.now();
  const slug = `http-author-${run}`;
  const archive = testcaseArchive();

  try {
    await page.goto("/auth/register");
    await page.getByLabel("Email").fill(`http-author-${run}@example.com`);
    await page.getByLabel("Username").fill(`http-author-${run}`);
    await page.getByLabel("Password").fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/me$/);

    await page.goto("/manage/problems");
    await page.getByLabel("Title").fill("HTTP Author Flow");
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Tags").fill("integration, validation");
    await page.getByRole("button", { name: "Create draft" }).click();
    await expect(page).toHaveURL(/\/manage\/problems\/\d+$/);
    const problemId = Number(page.url().split("/").at(-1));

    await page.getByLabel("Visibility").selectOption("public");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Problem settings saved.")).toBeVisible();

    await page.getByLabel("Description", { exact: true }).fill("Return the sum of two integers.");
    await page.getByLabel("Input description").fill("Two integers.");
    await page.getByLabel("Output description").fill("Their sum.");
    await page.getByLabel("Sample input").fill("1 1");
    await page.getByLabel("Sample output").fill("2");
    await page.getByRole("button", { name: "Save statement" }).click();
    await expect(page.getByText("Statement version saved.")).toBeVisible();

    await page.getByLabel("Archive").setInputFiles(archive.path);
    await page.getByRole("button", { name: "Upload archive" }).click();
    await expect(page.getByText("Testcase archive uploaded.")).toBeVisible();

    const blocked = await page.evaluate(async (id) => {
      const session = JSON.parse(window.localStorage.getItem("soj.session") ?? "null") as { accessToken: string };
      const response = await fetch(`/soj-api/api/v1/problems/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      return { status: response.status, body: await response.json() };
    }, problemId);
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe("problem.check_required");

    await page.getByRole("button", { name: "Run validation" }).click();
    await expect(page.getByText("Ready to publish")).toBeVisible();

    await page.getByLabel("Description", { exact: true }).fill("Return the sum of two signed integers.");
    await page.getByRole("button", { name: "Save statement" }).click();
    await expect(page.getByText("Statement version saved.")).toBeVisible();

    const staleStatementCheck = await publishProblem(page, problemId);
    expect(staleStatementCheck.status).toBe(422);
    expect(staleStatementCheck.body.error.code).toBe("problem.check_required");

    await page.getByRole("button", { name: "Run validation" }).click();
    await expect(page.getByText("Ready to publish")).toBeVisible();
    await page.getByRole("button", { name: "Publish problem" }).click();
    await expect(page.getByText("Problem published.")).toBeVisible();

    await page.goto(`/problems/${problemId}`);
    await page.getByLabel("Source code").fill("print(2)");
    await page.getByRole("button", { name: "Submit solution" }).click();
    const submissionLink = page.getByRole("link", { name: "View details" });
    await expect(submissionLink).toBeVisible();
    const href = await submissionLink.getAttribute("href");
    const submissionId = Number(href?.split("/").at(-1));

    await expect.poll(async () => page.evaluate(async (id) => {
      const session = JSON.parse(window.localStorage.getItem("soj.session") ?? "null") as { accessToken: string };
      const response = await fetch(`/soj-api/api/v1/submissions/${id}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const body = await response.json();
      return body.data.status;
    }, submissionId)).toBe("accepted");
  } finally {
    rmSync(archive.dir, { recursive: true, force: true });
  }
});

async function publishProblem(page: import("@playwright/test").Page, problemId: number) {
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

function testcaseArchive() {
  const dir = mkdtempSync(join(tmpdir(), "soj-http-authoring-"));
  writeFileSync(join(dir, "input1.txt"), "1 1\n");
  writeFileSync(join(dir, "output1.txt"), "2\n");
  execFileSync("zip", ["-q", "cases.zip", "input1.txt", "output1.txt"], { cwd: dir });
  return { dir, path: join(dir, "cases.zip") };
}
