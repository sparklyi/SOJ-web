import { PageShell } from "@/components/layout/page-shell";
import { AuthGate } from "@/components/soj/auth-gate";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { getCurrentUser } from "@/features/auth/api";

export default async function MePage() {
  const user = await getCurrentUser();

  return (
    <PageShell title="Me" description="Account state, problem progress, and recent SOJ activity.">
      <AuthGate user={user} fallback={<p className="text-sm text-soj-muted">Login is required.</p>}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <StatusPill tone="accent">Signed in</StatusPill>
            <div>
              <h2 className="text-2xl font-semibold">{user?.displayName}</h2>
              <p className="font-mono text-sm text-soj-muted">@{user?.handle}</p>
            </div>
            <p className="text-sm leading-6 text-soj-muted">Role: {user?.role}</p>
          </section>
          <section className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <h2 className="text-xl font-semibold">Progress</h2>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-soj-line pb-3 text-sm">
              <span className="text-soj-muted">Signal Path</span>
              <ProblemStatus status="accepted" />
            </div>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <span className="text-soj-muted">Cache Relay</span>
              <ProblemStatus status="attempted" />
            </div>
          </section>
        </div>
      </AuthGate>
    </PageShell>
  );
}
