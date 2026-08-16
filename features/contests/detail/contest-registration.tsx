"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import type { ContestStatus, ContestSummary } from "@/lib/api/types";
import { restoreSession } from "@/lib/auth/session";
import { contestRegistrationUserKey, isContestRegistered, markContestRegistered, subscribeToContestRegistrationChanges } from "@/lib/domain/contest-registration-session";
import { useI18n } from "@/components/providers/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";

type ContestRegistrationProps = {
  contest: ContestSummary & {
    canRegister: boolean;
    canSubmit: boolean;
  };
};

const hintByStatus: Record<ContestStatus, MessageKey> = {
  scheduled: "contests.registration.hint.scheduled",
  running: "contests.registration.hint.running",
  frozen: "contests.registration.hint.frozen",
  ended: "contests.registration.hint.ended",
  unsealed: "contests.registration.hint.unsealed",
};

export function ContestRegistration({ contest }: ContestRegistrationProps) {
  const { t } = useI18n();
  const firstProblemId = contest.problems[0]?.problemId;
  const apiMode = getApiMode();
  const hasSession = useBrowserSessionAvailable();
  const locallyRegistered = useLocalContestRegistration(contest.id, apiMode === "mock");
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
  >({ status: "idle" });
  const registered = contest.registered || (apiMode === "mock" && locallyRegistered) || state.status === "success";
  const needsSession = apiMode === "http" && !hasSession;
  const canSubmitRegistration = contest.canRegister && !registered && !needsSession && state.status !== "pending";
  const canEnter = (registered || contest.canSubmit) && Boolean(firstProblemId);
  const statusPill = useMemo(() => {
    if (registered) return <StatusPill tone="success">{t("status.registered")}</StatusPill>;
    return <StatusPill tone={contest.canRegister ? "accent" : "warning"}>{contest.canRegister ? t("contests.registration.open") : t("contests.registration.closed")}</StatusPill>;
  }, [contest.canRegister, registered, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitRegistration) return;

    const userKey = browserUserKey();
    const displayName = form.displayName.trim();
    const email = form.email.trim();
    const inviteCode = form.inviteCode.trim();

    setState({ status: "pending" });
    try {
      await createBrowserApiClient().contests.register(contest.id, {
        displayName,
        email,
        ...(inviteCode ? { inviteCode } : {}),
      });
      if (apiMode === "mock" && typeof window !== "undefined") markContestRegistered(window.localStorage, userKey, contest.id);
      setState({ status: "success" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : t("contests.registration.failed") });
    }
  }

  return (
    <section aria-label={t("contests.list.access")} className="soj-contest-access grid grid-cols-[minmax(0,1fr)] gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("contests.registration.access")}</h2>
        {statusPill}
      </div>

      <p className="text-sm leading-6 text-soj-muted">{t(hintByStatus[contest.status])}</p>

      {canEnter && firstProblemId ? (
        <LocalizedLink
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-soj-md border border-soj-accent/80 bg-soj-accent px-5 text-base font-medium text-soj-bg shadow-[0_10px_30px_rgb(var(--soj-accent)/0.18),inset_0_1px_0_rgb(255_255_255/0.26)] transition hover:bg-soj-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
          href={`/contests/${contest.id}/problems/${firstProblemId}`}
        >
          {t("contests.registration.enter")}
        </LocalizedLink>
      ) : contest.canRegister ? (
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm text-soj-muted">
            {t("contests.registration.displayName")}
            <input
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg/45 px-3 text-soj-text outline-none transition focus:border-soj-accent"
              name="displayName"
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              required
              value={form.displayName}
            />
          </label>
          <label className="grid gap-1 text-sm text-soj-muted">
            {t("contests.registration.email")}
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
            {t("contests.registration.inviteCode")}
            <input
              className="h-10 rounded-soj-md border border-soj-line bg-soj-bg/45 px-3 text-soj-text outline-none transition focus:border-soj-accent"
              name="inviteCode"
              onChange={(event) => setForm((current) => ({ ...current, inviteCode: event.target.value }))}
              value={form.inviteCode}
            />
          </label>
          <Button disabled={!canSubmitRegistration} loading={state.status === "pending"} type="submit" size="lg">
            {needsSession ? t("contests.registration.signInToRegister") : state.status === "pending" ? t("contests.registration.registering") : t("contests.registration.register")}
          </Button>
          {needsSession ? (
            <p className="text-sm text-soj-muted">
              <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                {t("contests.registration.signIn")}
              </LocalizedLink>{" "}
              {t("contests.registration.signInHint")}
            </p>
          ) : null}
          {state.status === "success" ? <p className="text-sm text-soj-muted">{t("contests.registration.saved")}</p> : null}
          {state.status === "error" ? <p className="text-sm text-soj-danger" role="alert">{state.message}</p> : null}
        </form>
      ) : (
        <Button type="button" size="lg" variant="secondary" disabled>
          {t("contests.registration.readOnly")}
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

function browserUserKey() {
  return contestRegistrationUserKey(browserSession()?.user);
}

function useBrowserSessionAvailable() {
  const [available, setAvailable] = useState(() => getApiMode() === "mock");

  useEffect(() => {
    function update() {
      setAvailable(getApiMode() === "mock" || browserHasSession());
    }

    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return available;
}

function useLocalContestRegistration(contestId: number, enabled: boolean) {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function update() {
      setRegistered(isContestRegistered(window.localStorage, browserUserKey(), contestId));
    }

    update();
    return subscribeToContestRegistrationChanges(update);
  }, [contestId, enabled]);

  return registered;
}
