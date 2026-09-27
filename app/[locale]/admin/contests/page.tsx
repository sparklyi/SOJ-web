import { AdminShell } from "@/features/admin/console/admin-shell";
import { ContestAdmin } from "@/features/admin/contests/contest-admin";

export default function AdminContestsPage() {
  return (
    <AdminShell active="contests">
      <ContestAdmin />
    </AdminShell>
  );
}
