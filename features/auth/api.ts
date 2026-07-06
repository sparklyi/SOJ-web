import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";

export async function getCurrentUser(client: ApiClient = createApiClient()) {
  return client.auth.me();
}
