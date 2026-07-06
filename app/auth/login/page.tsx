import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { StatusPill } from "@/components/soj/status-pill";
import { MockAuthForm } from "@/features/auth/mock-auth-form";

export default function LoginPage() {
  return (
    <PageShell title="Login" description="Enter SOJ with a local mock account for contests, problems, and submissions.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <MockAuthForm mode="login" />
        <section className="grid grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <StatusPill tone="accent">Mock mode</StatusPill>
          <h2 className="text-xl font-semibold">Session state</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">SOJ keeps access state consistent across contest, problem, and account surfaces.</p>
          <Link className="text-sm font-medium text-soj-accent hover:text-soj-text" href="/auth/register">
            Create an account
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
