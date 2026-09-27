import { AdminShell } from "@/features/admin/console/admin-shell";
import { LanguageAdmin } from "@/features/admin/languages/language-admin";

export default function AdminLanguagesPage() {
  return (
    <AdminShell active="languages">
      <LanguageAdmin />
    </AdminShell>
  );
}
