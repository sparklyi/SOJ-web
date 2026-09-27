import { createApiClient } from "@/lib/api/client";
import type { AdminContest, AdminContestFilter, AdminContestInput, ApiClient, PageResult } from "@/lib/api/types";

export async function listAdminContests(
  filter: AdminContestFilter = {},
  client: ApiClient = createApiClient(),
): Promise<PageResult<AdminContest>> {
  return client.admin.contests.list(filter);
}

export async function createAdminContest(input: AdminContestInput, client: ApiClient = createApiClient()): Promise<AdminContest> {
  return client.admin.contests.create(input);
}

export async function updateAdminContest(id: number, input: AdminContestInput, client: ApiClient = createApiClient()): Promise<AdminContest> {
  return client.admin.contests.update(id, input);
}

export async function archiveAdminContest(id: number, client: ApiClient = createApiClient()): Promise<void> {
  return client.admin.contests.archive(id);
}
