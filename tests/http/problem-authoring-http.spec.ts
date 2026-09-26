import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const templateArchive = join(process.cwd(), "public", "examples", "testcases.zip");
const backendDir = process.env.SOJ_BACKEND_DIR ?? join(process.cwd(), "..", "SOJ");
const composeFile = join(backendDir, "deploy", "docker-compose.yaml");

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

    // 真实后端把建题权限绑在 author 角色上，注册只发 user 角色；这与 mock 注册即
    // 作者不同。这里通过部署自带的 postgres 授一次 author，等价于管理员在
    // /admin/users 上的授权（角色按请求从库里读，无需重新登录）。
    grantAuthorRole(`http-author-${run}@example.com`);

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

    // 题面已就绪、还没有测试集：flow 落在 testcase，blocker 点名该步。
    const afterStatement = await fetchAuthoringState(page, problemId);
    expect(afterStatement.publishable).toBe(false);
    expect(afterStatement.blockers.map((blocker) => [blocker.code, blocker.step])).toContainEqual(["problem.testcase_required", "testcase"]);
    expect(afterStatement.flow.current_step).toBe("testcase");

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

    // 测试集就绪、还没有校验：flow 落在 check，blocker 点名该步。
    const beforeCheck = await fetchAuthoringState(page, problemId);
    expect(beforeCheck.publishable).toBe(false);
    expect(beforeCheck.blockers.map((blocker) => [blocker.code, blocker.step])).toContainEqual(["problem.check_required", "check"]);
    expect(beforeCheck.flow.current_step).toBe("check");

    await page.getByRole("button", { name: "Validation" }).click();
    await page.getByRole("button", { name: "Run validation" }).click();
    await expect(page.getByText("The current versions passed validation.")).toBeVisible();

    // 校验通过后没有 blocker，flow 推进到提审。
    const afterCheck = await fetchAuthoringState(page, problemId);
    expect(afterCheck.publishable).toBe(true);
    expect(afterCheck.blockers).toEqual([]);
    expect(afterCheck.flow.current_step).toBe("review");

    await page.getByRole("button", { name: "Review" }).click();
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Problem submitted for review.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Review in progress" })).toBeDisabled();
  } finally {
    rmSync(broken.dir, { recursive: true, force: true });
  }
});

type AuthoringProbe = {
  flow: { current_step: string; remaining: number };
  publishable: boolean;
  blockers: Array<{ code: string; step: string }>;
};

/** 直读 authoring state，核对后端算出的 flow/blockers 契约（前端 stepper 与门禁的依据）。 */
async function fetchAuthoringState(page: import("@playwright/test").Page, problemId: number): Promise<AuthoringProbe> {
  const envelope = await page.evaluate(async (id) => {
    const session = JSON.parse(window.localStorage.getItem("soj.session") ?? "null") as { accessToken: string };
    const response = await fetch(`/soj-api/api/v1/problems/${id}/authoring`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    return (await response.json()) as { data: unknown };
  }, problemId);
  return envelope.data as AuthoringProbe;
}

/** 给刚注册的账号授 author，使之后的建题/上传/校验请求满足后端 RBAC。 */
function grantAuthorRole(email: string) {
  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      composeFile,
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "soj",
      "-d",
      "soj",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `INSERT INTO user_role_assignments (user_id, role_code, granted_at) SELECT id, 'author', now() FROM users WHERE email = '${email}' ON CONFLICT DO NOTHING;`,
    ],
    { stdio: "inherit" },
  );
}

/** 只含 `3.in`、缺 `3.ans` 的坏包：后端应在 details.findings 里点名这个文件。 */
function brokenArchive() {
  const dir = mkdtempSync(join(tmpdir(), "soj-http-authoring-"));
  writeFileSync(join(dir, "3.in"), "1 2\n");
  execFileSync("zip", ["-q", "broken.zip", "3.in"], { cwd: dir });
  return { dir, path: join(dir, "broken.zip") };
}
