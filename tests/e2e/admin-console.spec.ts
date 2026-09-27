import { expect, test, type Page } from "@playwright/test";
import { injectSession } from "./helpers/session";

const adminPermissions = [
  "system.manage",
  "audit.read",
  "problem.manage_all",
  "contest.manage_all",
  "user.manage",
  "role.grant",
  "role.revoke",
  "role.permission.manage",
];

async function injectAdmin(page: Page) {
  await injectSession(page, { roles: ["user", "admin"], permissions: adminPermissions });
}

test("admin toggles a language and the audit trail records it", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Administration" });

  await tabs.getByRole("link", { name: "Languages" }).click();
  await expect(page.getByRole("heading", { name: "Judge languages" })).toBeVisible();
  await page.getByRole("button", { name: "Disable" }).first().click();
  await expect(page.getByText("Language updated.")).toBeVisible();

  await tabs.getByRole("link", { name: "Audit" }).click();
  await expect(page.getByRole("heading", { name: "Audit trail" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Language disabled" }).first()).toBeVisible();
});

test("admin archives and restores a problem", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin/problems");
  await expect(page.getByRole("heading", { name: "Problem management" })).toBeVisible();

  const firstRow = page.getByRole("table").locator("tbody tr").first();
  await firstRow.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Problem archived.")).toBeVisible();
  await expect(firstRow.getByRole("button", { name: "Restore" })).toBeVisible();

  await firstRow.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("Problem restored.")).toBeVisible();
  await expect(firstRow.getByRole("button", { name: "Archive" })).toBeVisible();
});

test("admin creates and archives a contest", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin/contests");
  await expect(page.getByRole("heading", { name: "Contest management" })).toBeVisible();

  await page.getByRole("button", { name: "New contest" }).click();
  await page.getByLabel("Title").fill("E2E Round");
  await page.getByLabel("Starts at").fill("2030-01-01T10:00");
  await page.getByLabel("Ends at").fill("2030-01-01T12:00");
  await page.getByLabel("Freeze at").fill("2030-01-01T11:00");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Contest saved.")).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: "E2E Round" });
  await row.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Contest archived.")).toBeVisible();
  await expect(row.getByText("Archived")).toBeVisible();
});

test("admin disables and re-enables a user", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: "aya-sato" });
  await row.getByRole("button", { name: "Disable", exact: true }).click();
  await expect(page.getByText("User disabled.")).toBeVisible();

  await row.getByRole("button", { name: "Enable", exact: true }).click();
  await expect(page.getByText("User enabled.")).toBeVisible();
});

test("admin grants a role through the dialog", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin/users");

  const row = page.getByRole("row").filter({ hasText: "aya-sato" });
  await row.getByRole("button", { name: "Manage roles" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.getByLabel("Reason for this change").fill("e2e operator grant");
  await dialog.getByRole("button", { name: "Grant", exact: true }).first().click();
  await expect(dialog.getByText("Role granted.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Revoke", exact: true }).last()).toBeVisible();
});

test("a plain account gets the 403 wall on an admin URL", async ({ page }) => {
  await injectSession(page);
  await page.goto("/admin/problems");

  await expect(page.getByText("403 · Permission required")).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("admin edits the role permission matrix from the admin tab", async ({ page }) => {
  await injectAdmin(page);
  await page.goto("/admin");

  const tabs = page.getByRole("navigation", { name: "Administration" });
  await tabs.getByRole("link", { name: "Roles" }).click();
  await expect(page.getByRole("heading", { name: "Role permissions" })).toBeVisible();

  // contest.create is a global capability despite the contest prefix, so the
  // global author column may hold it.
  const checkbox = page.getByRole("checkbox", { name: "author contest.create" });
  await expect(checkbox).toBeEnabled();
  await checkbox.check();

  await page.getByRole("button", { name: "Save Author" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason").fill("e2e grant contest creation");
  await dialog.getByRole("button", { name: "Apply" }).click();

  await expect(page.getByText("Role permissions updated.")).toBeVisible();
});
