import { createApiClient } from "@/lib/api/client";
import type { AdminUserStatus, ApiClient } from "@/lib/api/types";
import type { GlobalRole } from "@/lib/auth/permissions";

export async function listAdminUsers(
  filter: { keyword?: string; status?: AdminUserStatus } = {},
  client: ApiClient = createApiClient(),
) {
  return client.admin.listUsers(filter);
}

export async function updateAdminUser(
  id: number,
  input: { username?: string; status?: AdminUserStatus },
  client: ApiClient = createApiClient(),
) {
  return client.admin.updateUser(id, input);
}

export async function grantGlobalRole(id: number, role: GlobalRole, reason: string, client: ApiClient = createApiClient()) {
  return client.admin.grantRole(id, { role, reason });
}

export async function revokeGlobalRole(id: number, role: GlobalRole, reason: string, client: ApiClient = createApiClient()) {
  return client.admin.revokeRole(id, { role, reason });
}
