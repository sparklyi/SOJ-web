import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";

export async function listEnabledLanguages(client: ApiClient = createApiClient()) {
  return client.languages.list({ enabled: true, engine: "soj-agent" });
}
