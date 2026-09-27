import { createApiClient } from "@/lib/api/client";
import type { AdminLanguageUpdateInput, ApiClient, JudgeLanguage, PageResult } from "@/lib/api/types";

export async function listAdminLanguages(
  page = 1,
  pageSize = 20,
  client: ApiClient = createApiClient(),
): Promise<PageResult<JudgeLanguage>> {
  return client.admin.languages.list({ page, pageSize });
}

export async function updateAdminLanguage(
  id: number,
  input: AdminLanguageUpdateInput,
  client: ApiClient = createApiClient(),
): Promise<JudgeLanguage> {
  return client.admin.languages.update(id, input);
}
