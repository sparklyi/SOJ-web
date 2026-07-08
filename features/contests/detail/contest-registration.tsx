"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import type { ContestStatus, ContestSummary } from "@/lib/api/types";
import { restoreSession } from "@/lib/auth/session";
import { isContestRegistered, markContestRegistered, subscribeToContestRegistrationChanges } from "@/lib/domain/contest-registration-session";

type ContestRegistrationProps = {
  contest: ContestSummary & {
    canRegister: boolean;
    canSubmit: boolean;
  };
};

const hintByStatus: Record<ContestStatus, string> = {
  scheduled: "Register before the start window to unlock contest problems and submissions.",
  running: "Submissions are accepted for registered participants while the contest is live.",
  frozen: "Submissions remain open for registered participants, but public ranks are frozen.",
  ended: "The contest window has closed. Problems are available for review when permitted.",
  unsealed: "Final ranks are public and the contest is available for post-contest review.",
};

export function ContestRegistration({ contest }: ContestRegistrationProps) {
  const firstProblemId = contest.problems[0]?.problemId;
  const hasSession = useBrowserSessionAvailable();
  const locallyRegistered = useLocalContestRegistration(contest.id);
  const registered = contest.registered || locallyRegistered;
  const [form, setForm] = useState(() => ({
    displayName: browserSession()?.user.displayName ?? browserSession()?.user.handle ?? "",
    email: "",
    inviteCode: "",
  }));
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success" }
    | { status: "error"; message: string }
  >({ status: registered ? "success" : "idle" });
  const needsSession = getApiMode() === "http" && !hasSession;
  const canSubmitRegistration = contest.canRegister && !registered && !needsSession && state.status !== "pending";
  const canEnter = (registered || contest.canSubmit || state.status === "success") && Boolean(firstProblemId);
  const statusPill = useMemo(() => {
    if (registered || state.status === "success") return <StatusPill tone="success">Registered</StatusPill>;
    return <StatusPill tone={contest.canRegister ? "accent" : "warning"}>{contest.canRegister ? "Registration open" : "Registration closed"}</StatusPill>;
  }, [contest.canRegister, registered, state.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitRegistration) return;

    setState({ status: "pending" });
    try {
      await createBrowserApiClient().contests.register(contest.id, {
        displayName: form.displayName,
        email: form.email,
        ...(form.inviteCode.trim() ? { inviteCode: form.inviteCode.trim() } : {}),
      });
      if (typeof window !== "undefined") markContestRegistered(window.localStorage, contest.id);
      setState({ status: "success" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Registration failed." });
    }
  }

  return (
    <section aria-label="Contest access" className="soj-contest-access grid grid-cols-[minmax(0,1fr)] gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Access</h2>
        {statusPill}
      </div>

      <p className="text-sm leading-6 text-soj-muted">{hintByStatus[contest.status]}</p>

      {canEnter && firstProblemId ? (
        <Link
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-soj-md border border-soj-accent/80 bg-soj-accent px-5 text-base font-medium text-soj-bg shadow-[0_10px_30px_rgb(var(--soj-accent)/0.18),inset_0_1px_0_rgb(255_255_255/0.26)] transition hover:bg-soj-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
          href={`/contests/${contest.id}/problems/${firstProblemId}`}
        >
          Enter contest
        </Link>
      ) : contest.canRegister ? (
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm text-soj-muted">
            Display name
            <input
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg/45 px-3 text-soj-text outline-none transition focus:border-soj-accent"
              name="displayName"
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              required
              value={form.displayName}
            />
          </label>
          <label className="grid gap-1 text-sm text-soj-muted">
            Email
            <input
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg/45 px-3 text-soj-text outline-none transition focus:border-soj-accent"
              name="email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="grid gap-1 text-sm text-soj-muted">
            Invite code
            <input
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg/45 px-3 text-soj-text outline-none transition focus:border-soj-accent"
              name="inviteCode"
              onChange={(event) => setForm((current) => ({ ...current, inviteCode: event.target.value }))}
              value={form.inviteCode}
            />
          </label>
          <Button disabled={!canSubmitRegistration} loading={state.status === "pending"} type="submit" size="lg">
            {needsSession ? "Sign in to register" : state.status === "pending" ? "Registering..." : "Register"}
          </Button>
          {needsSession ? (
            <p className="text-sm text-soj-muted">
              <Link className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                Sign in
              </Link>{" "}
              to register for this contest.
            </p>
          ) : null}
          {state.status === "success" ? <p className="text-sm text-soj-muted">Registration saved for this browser.</p> : null}
          {state.status === "error" ? <p className="text-sm text-soj-danger">{state.message}</p> : null}
        </form>
      ) : (
        <Button type="button" size="lg" variant="secondary" disabled>
          Read only
        </Button>
      )}
    </section>
  );
}

function browserSession() {
  if (typeof window === "undefined") return null;
  return restoreSession(window.localStorage);
}

function browserHasSession() {
  return Boolean(browserSession());
}

function useBrowserSessionAvailable() {
  return useSyncExternalStore(
    subscribeToSessionChanges,
    () => getApiMode() === "mock" || browserHasSession(),
    () => getApiMode() === "mock",
  );
}

function useLocalContestRegistration(contestId: number) {
  return useSyncExternalStore(
    subscribeToContestRegistrationChanges,
    () => (typeof window === "undefined" ? false : isContestRegistered(window.localStorage, contestId)),
    () => false,
  );
}

function subscribeToSessionChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}
