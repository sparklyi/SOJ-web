import { StatusPill } from "@/components/soj/status-pill";
import { Input } from "@/components/ui/input";
import { AccountSurface } from "@/features/auth/account-surface";
import { getCurrentUser } from "@/features/auth/api";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <AccountSurface
      eyebrow="Control console"
      title="Settings"
      description="Account preferences and local workspace defaults."
      meta="Local defaults"
      signal={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Workspace</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">Synced</p>
            </div>
            <StatusPill tone="accent">Local</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>Theme</span>
              <strong>Signal</strong>
            </div>
            <div className="soj-submission-chip">
              <span>Editor</span>
              <strong>C++17</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <h2 className="text-xl font-semibold">Profile</h2>
          <Input id="settings-handle" label="Handle" value={user?.handle ?? ""} readOnly helperText="Loaded from the current account boundary." />
          <Input id="settings-name" label="Display name" value={user?.displayName ?? ""} readOnly />
        </section>
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="accent">Local</StatusPill>
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">Theme, language, and contest workspace defaults are staged here for the next settings pass.</p>
          <div className="grid gap-2">
            {["Signal Arena theme", "C++17 default language", "Judge feedback pinned"].map((item) => (
              <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-soj-md border border-soj-line/50 bg-soj-bg/24 px-3 py-3 text-sm text-soj-muted">
                <span className="h-2 w-2 rounded-full bg-soj-accent" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AccountSurface>
  );
}
