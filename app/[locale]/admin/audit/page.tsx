import { AdminShell } from "@/features/admin/console/admin-shell";
import { AuditLog } from "@/features/admin/audit/audit-log";

export default function AdminAuditPage() {
  return (
    <AdminShell active="audit">
      <AuditLog />
    </AdminShell>
  );
}
