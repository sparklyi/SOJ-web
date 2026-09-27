import { AdminShell } from "@/features/admin/console/admin-shell";
import { RolePermissionMatrix } from "@/features/admin/roles/role-permission-matrix";

export default function AdminRolesPage() {
  return (
    <AdminShell active="roles">
      <RolePermissionMatrix />
    </AdminShell>
  );
}
