import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { AdminOverview } from "@/features/admin/console/admin-overview";
import { AdminShell } from "@/features/admin/console/admin-shell";
import { AuditLog } from "@/features/admin/audit/audit-log";
import { LanguageAdmin } from "@/features/admin/languages/language-admin";
import { ProblemAdmin } from "@/features/admin/problems/problem-admin";
import { UserRoleManager } from "@/features/admin/user-role-manager";
import { adminModulePermissions, adminModules, canOpenAdmin } from "@/features/admin/modules";
import type { CurrentUser } from "@/lib/api/types";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { permissions } from "@/lib/auth/permissions";
import { mockAdminUser, mockUser } from "@/lib/mock/fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/admin",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithSession(ui: React.ReactNode, user?: CurrentUser) {
  if (user) saveSession(window.localStorage, createMockSession(user));

  return render(<AppProviders>{ui}</AppProviders>);
}

describe("admin module registry", () => {
  it("maps every console page to a real permission", () => {
    for (const entry of adminModules) {
      expect(permissions).toContain(entry.permission);
      expect(entry.path.startsWith("/admin/")).toBe(true);
    }
    expect(new Set(adminModules.map((entry) => entry.key)).size).toBe(adminModules.length);
    expect(new Set(adminModules.map((entry) => entry.path)).size).toBe(adminModules.length);
  });

  it("opens the console only when a module permission is held", () => {
    expect(canOpenAdmin((permission) => mockAdminUser.permissions.includes(permission))).toBe(true);
    expect(canOpenAdmin((permission) => mockUser.permissions.includes(permission))).toBe(false);
  });

  it("exposes one permission per page and no total gate", () => {
    expect(adminModulePermissions()).not.toContain(undefined);
    expect(adminModulePermissions().length).toBeGreaterThanOrEqual(4);
  });
});

describe("admin console gating", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("shows the 403 state instead of a console page to an account without the page permission", async () => {
    renderWithSession(
      <AdminShell active="problems">
        <ProblemAdmin />
      </AdminShell>,
      mockUser,
    );

    await waitFor(() => expect(screen.getByText("403 · Permission required")).toBeVisible());
    expect(screen.queryByText("Problem management")).not.toBeInTheDocument();
  });

  it("renders only the overview cards the account can open", async () => {
    renderWithSession(<AdminOverview />, mockAdminUser);

    await waitFor(() => expect(screen.getByRole("link", { name: /Languages/ })).toBeVisible());
    expect(screen.getByRole("link", { name: /Problems/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Contests/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Users/ })).toBeVisible();
  });

  it("denies the overview to an account with no admin permission", async () => {
    renderWithSession(<AdminOverview />, mockUser);

    await waitFor(() => expect(screen.getByText("403 · Permission required")).toBeVisible());
    expect(screen.queryByRole("link", { name: /Languages/ })).not.toBeInTheDocument();
  });
});

describe("language administration", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("toggles enablement through the admin endpoint and reports it", async () => {
    renderWithSession(<LanguageAdmin />, mockAdminUser);

    const disableButtons = await screen.findAllByRole("button", { name: "Disable" });
    fireEvent.click(disableButtons[0]);

    await waitFor(() => expect(screen.getByText("Language updated.")).toBeVisible());
  });
});

describe("user administration", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("lists users in a table and only disables the status action on your own row", async () => {
    renderWithSession(<UserRoleManager />, mockAdminUser);

    await waitFor(() => expect(screen.getByText("lin.chen@soj.dev")).toBeVisible());
    const selfRow = screen.getByText("lin.chen@soj.dev").closest("tr");
    const otherRow = screen.getByText("aya.sato@soj.dev").closest("tr");
    expect(selfRow).not.toBeNull();
    expect(otherRow).not.toBeNull();
    expect(within(selfRow!).getByRole("button", { name: "Disable" })).toBeDisabled();
    expect(within(otherRow!).getByRole("button", { name: "Disable" })).toBeEnabled();
  });

  it("blocks role changes on your own account inside the dialog", async () => {
    renderWithSession(<UserRoleManager />, mockAdminUser);

    await waitFor(() => expect(screen.getByText("lin.chen@soj.dev")).toBeVisible());
    const selfRow = screen.getByText("lin.chen@soj.dev").closest("tr");
    fireEvent.click(within(selfRow!).getByRole("button", { name: "Manage roles" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("You cannot change your own global roles.")).toBeVisible();
    expect(within(dialog).getByText("Fixed")).toBeVisible();
    const grantButtons = within(dialog).getAllByRole("button", { name: "Grant" });
    expect(grantButtons.length).toBeGreaterThan(0);
    for (const button of grantButtons) expect(button).toBeDisabled();
  });
});

describe("audit trail", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("renders a role permission update with the role code and its diff", async () => {
    renderWithSession(<AuditLog />, mockAdminUser);

    await waitFor(() => expect(screen.getByText("Role permissions updated")).toBeVisible());
    expect(screen.getByText("Role · author")).toBeVisible();
    expect(screen.getByText(/problem\.edit_own/)).toBeVisible();
  });
});
