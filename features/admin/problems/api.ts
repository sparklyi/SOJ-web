import { createApiClient } from "@/lib/api/client";
import type { AdminProblemFilter, ApiClient, AuthoringProblem, PageResult } from "@/lib/api/types";

export async function listAdminProblems(
  filter: AdminProblemFilter = {},
  client: ApiClient = createApiClient(),
): Promise<PageResult<AuthoringProblem>> {
  return client.admin.problems.list(filter);
}

export async function archiveAdminProblem(id: number, client: ApiClient = createApiClient()): Promise<void> {
  return client.admin.problems.archive(id);
}

export async function restoreAdminProblem(id: number, client: ApiClient = createApiClient()): Promise<AuthoringProblem> {
  return client.admin.problems.restore(id);
}
