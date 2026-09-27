import { createApiClient } from "@/lib/api/client";
import type { AdminLanguageUpdateInput, ApiClient, JudgeLanguage, PageResult } from "@/lib/api/types";

export async function listAdminLanguages(client: ApiClient = createApiClient()): Promise<PageResult<JudgeLanguage>> {
  return client.admin.languages.list();
}

export async function updateAdminLanguage(
  id: number,
  input: AdminLanguageUpdateInput,
  client: ApiClient = createApiClient(),
): Promise<JudgeLanguage> {
  return client.admin.languages.update(id, input);
}
