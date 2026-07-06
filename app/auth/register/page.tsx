import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { StatusPill } from "@/components/soj/status-pill";
import { MockAuthForm } from "@/features/auth/mock-auth-form";

export default function RegisterPage() {
  return (
    <PageShell title="Register" description="Create a local SOJ account for the v2 contest workspace.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <MockAuthForm mode="register" />
        <section className="grid grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <StatusPill tone="success">Ready</StatusPill>
          <h2 className="text-xl font-semibold">Permission-aware by default</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">Registration keeps the same compact field rhythm as the rest of the contest workspace.</p>
          <Link className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/auth/login">
            Back to login
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
