import Link from "next/link";
import { StatusPill } from "@/components/soj/status-pill";
import { AccountSurface } from "@/features/auth/account-surface";
import { MockAuthForm } from "@/features/auth/mock-auth-form";

export default function LoginPage() {
  return (
    <AccountSurface
      eyebrow="Access console"
      title="Login"
      description="Enter SOJ with a local mock account for contests, problems, and submissions."
      meta="Mock session"
      signal={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Session route</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">Contest ready</p>
            </div>
            <StatusPill tone="accent">Mock mode</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>Auth</span>
              <strong>Local</strong>
            </div>
            <div className="soj-submission-chip">
              <span>Access</span>
              <strong>Web</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <MockAuthForm mode="login" />
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="accent">Mock mode</StatusPill>
          <h2 className="text-xl font-semibold">Session state</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">SOJ keeps access state consistent across contest, problem, and account surfaces.</p>
          <Link className="inline-flex min-h-10 w-fit items-center rounded-soj-md border border-soj-line/60 bg-soj-bg/28 px-3 text-sm font-medium text-soj-accent transition hover:border-soj-accent/55 hover:text-soj-text focus-visible:outline-soj-accent" href="/auth/register">
            Create an account
          </Link>
        </section>
      </div>
    </AccountSurface>
  );
}
