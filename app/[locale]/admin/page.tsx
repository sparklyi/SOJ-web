import { AdminOverview } from "@/features/admin/console/admin-overview";
import { AdminShell } from "@/features/admin/console/admin-shell";

export default function AdminPage() {
  return (
    <AdminShell active="overview">
      <AdminOverview />
    </AdminShell>
  );
}
