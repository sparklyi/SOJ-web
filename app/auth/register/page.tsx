import Link from "next/link";
import { StatusPill } from "@/components/soj/status-pill";
import { AccountSurface } from "@/features/auth/account-surface";
import { MockAuthForm } from "@/features/auth/mock-auth-form";

export default function RegisterPage() {
  return (
    <AccountSurface
      eyebrow="Identity route"
      title="Register"
      description="Create a local SOJ account for the v2 contest workspace."
      meta="Mock onboarding"
      signal={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Account state</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">Ready</p>
            </div>
            <StatusPill tone="success">Open</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>Profile</span>
              <strong>Handle</strong>
            </div>
            <div className="soj-submission-chip">
              <span>Scope</span>
              <strong>SOJ</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <MockAuthForm mode="register" />
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="success">Ready</StatusPill>
          <h2 className="text-xl font-semibold">Permission-aware by default</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">Registration keeps the same compact field rhythm as the rest of the contest workspace.</p>
          <Link className="inline-flex min-h-10 w-fit items-center rounded-soj-md border border-soj-line/60 bg-soj-bg/28 px-3 text-sm font-medium text-soj-accent transition hover:border-soj-accent/55 hover:text-soj-text focus-visible:outline-soj-accent" href="/auth/login">
            Back to login
          </Link>
        </section>
      </div>
    </AccountSurface>
  );
}
