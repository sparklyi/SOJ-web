import { createApiClient } from "@/lib/api/client";
import type { ApiClient, RolePermissionEntry, RolePermissionMatrix, UpdateRolePermissionsInput } from "@/lib/api/types";
import type { Role } from "@/lib/auth/permissions";

export async function getRolePermissionMatrix(client: ApiClient = createApiClient()): Promise<RolePermissionMatrix> {
  return client.admin.rolePermissions();
}

export async function updateRolePermissions(
  role: Role,
  input: UpdateRolePermissionsInput,
  client: ApiClient = createApiClient(),
): Promise<RolePermissionEntry> {
  return client.admin.updateRolePermissions(role, input);
}
