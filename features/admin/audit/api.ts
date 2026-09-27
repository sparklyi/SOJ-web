import { createApiClient } from "@/lib/api/client";
import type { ApiClient, AuditEvent, AuditEventFilter, PageResult } from "@/lib/api/types";

export async function listAuditEvents(filter: AuditEventFilter = {}, client: ApiClient = createApiClient()): Promise<PageResult<AuditEvent>> {
  return client.admin.audit.list(filter);
}
