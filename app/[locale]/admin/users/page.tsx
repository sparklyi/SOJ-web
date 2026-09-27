import { AdminShell } from "@/features/admin/console/admin-shell";
import { UserRoleManager } from "@/features/admin/user-role-manager";

export default function AdminUsersPage() {
  return (
    <AdminShell active="users">
      <UserRoleManager />
    </AdminShell>
  );
}
