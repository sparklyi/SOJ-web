import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { AdminOverview } from "@/features/admin/console/admin-overview";
import { AdminShell } from "@/features/admin/console/admin-shell";
import { LanguageAdmin } from "@/features/admin/languages/language-admin";
import { ProblemAdmin } from "@/features/admin/problems/problem-admin";
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
