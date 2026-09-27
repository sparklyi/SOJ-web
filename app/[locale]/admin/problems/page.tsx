import { AdminShell } from "@/features/admin/console/admin-shell";
import { ProblemAdmin } from "@/features/admin/problems/problem-admin";

export default function AdminProblemsPage() {
  return (
    <AdminShell active="problems">
      <ProblemAdmin />
    </AdminShell>
  );
}
