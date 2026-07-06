import { PageShell } from "@/components/layout/page-shell";
import { StatusPill } from "@/components/soj/status-pill";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/features/auth/api";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <PageShell title="Settings" description="Account preferences and local workspace defaults.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <h2 className="text-xl font-semibold">Profile</h2>
          <Input id="settings-handle" label="Handle" value={user?.handle ?? ""} readOnly helperText="Loaded from the current account boundary." />
          <Input id="settings-name" label="Display name" value={user?.displayName ?? ""} readOnly />
        </section>
        <section className="grid grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <StatusPill tone="accent">Local</StatusPill>
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">Theme and editor defaults will appear here as the workspace surfaces land.</p>
        </section>
      </div>
    </PageShell>
  );
}
