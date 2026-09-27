import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { RolePermissionMatrix } from "@/features/admin/roles/role-permission-matrix";
import type { CurrentUser, RolePermissionMatrix as RolePermissionMatrixModel } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { roles } from "@/lib/auth/permissions";
import { mockAdminUser } from "@/lib/mock/fixtures";
import { lockedRoles, permissionCatalog, permissionsForRole, roleScope } from "@/lib/mock/role-permissions";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  rolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  createBrowserApiClient: () => ({
    auth: { me: mocks.me },
    admin: { rolePermissions: mocks.rolePermissions, updateRolePermissions: mocks.updateRolePermissions },
  }),
}));

function matrixFixture(): RolePermissionMatrixModel {
  const catalog = permissionCatalog();
  return {
    permissions: catalog,
    roles: roles.map((role) => ({
      code: role,
      scope: roleScope(role),
      locked: lockedRoles.includes(role),
      permissions: lockedRoles.includes(role) ? catalog.map((entry) => entry.code) : permissionsForRole(role),
    })),
  };
}

function renderMatrix(user: CurrentUser = mockAdminUser) {
  saveSession(window.localStorage, createMockSession(user));
  return render(
    <AppProviders>
      <RolePermissionMatrix />
    </AppProviders>,
  );
}

async function openReasonDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "Save Author" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Reason"), { target: { value: "grant the author the manager bypass" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
}

describe("role permission matrix", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.me.mockResolvedValue(mockAdminUser);
    mocks.rolePermissions.mockResolvedValue(matrixFixture());
    mocks.updateRolePermissions.mockImplementation(async (role: string, input: { permissions: string[] }) => ({
      code: role,
      scope: roleScope(role as (typeof roles)[number]),
      locked: false,
      permissions: input.permissions,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders one column per role and disables the locked admin column", async () => {
    renderMatrix();

    const checkbox = await screen.findByRole("checkbox", { name: "admin problem.create" });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
    // admin and root are the two locked columns.
    expect(screen.getAllByText("Locked")).toHaveLength(2);
  });

  it("disables non-delegable rows in every editable column", async () => {
    renderMatrix();

    expect(await screen.findByRole("checkbox", { name: "author system.manage" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "author role.permission.manage" })).toBeDisabled();
    // A delegable permission in the same column stays editable.
    expect(screen.getByRole("checkbox", { name: "author problem.create" })).toBeEnabled();
  });

  it("disables cells whose scope does not match the role", async () => {
    renderMatrix();

    // author is a global role; contest.read is contest-scoped.
    expect(await screen.findByRole("checkbox", { name: "author contest.read" })).toBeDisabled();
    // contest_judge is a contest role; problem.create is global.
    expect(screen.getByRole("checkbox", { name: "contest_judge problem.create" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "contest_judge contest.read" })).toBeEnabled();
    // contest.create and contest.manage_all are global capabilities despite the
    // contest prefix: a global role may hold them, a contest role may not.
    expect(screen.getByRole("checkbox", { name: "author contest.create" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "author contest.manage_all" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "contest_judge contest.create" })).toBeDisabled();
  });

  it("tracks dirty state per role and sends the edited set with the reason", async () => {
    renderMatrix();

    const save = await screen.findByRole("button", { name: "Save Author" });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "author problem.manage_all" }));
    await waitFor(() => expect(save).toBeEnabled());

    await openReasonDialog();

    await waitFor(() => expect(mocks.updateRolePermissions).toHaveBeenCalledTimes(1));
    const [role, input] = mocks.updateRolePermissions.mock.calls[0];
    expect(role).toBe("author");
    expect(input.reason).toBe("grant the author the manager bypass");
    expect(input.permissions).toEqual(
      expect.arrayContaining([...permissionsForRole("author"), "problem.manage_all"]),
    );
    expect(await screen.findByText("Role permissions updated.")).toBeVisible();

    // The returned role replaces the local state, so the column is clean again.
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Author" })).toBeDisabled());
  });

  it("surfaces a mapped message when the backend rejects the update", async () => {
    mocks.updateRolePermissions.mockRejectedValue(new ApiError("forbidden", "auth.forbidden", 403));
    renderMatrix();

    fireEvent.click(await screen.findByRole("checkbox", { name: "author problem.manage_all" }));
    await openReasonDialog();

    expect(await screen.findByText("You do not have permission to edit role permissions.")).toBeVisible();
  });

  it("requires a reason before saving", async () => {
    renderMatrix();

    fireEvent.click(await screen.findByRole("checkbox", { name: "author problem.manage_all" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save Author" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));

    expect(await within(dialog).findByText("A reason is required.")).toBeVisible();
    expect(mocks.updateRolePermissions).not.toHaveBeenCalled();
  });
});
