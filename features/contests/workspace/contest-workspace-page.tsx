"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ContestClock } from "@/components/soj/contest-clock";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { Button } from "@/components/ui/button";
import type { ContestStatus, ContestSummary, JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";
import { contestRegistrationUserKey, isContestRegistered, subscribeToContestRegistrationChanges } from "@/lib/domain/contest-registration-session";
import { listEnabledLanguages } from "@/features/languages/api";
import type { MessageKey } from "@/lib/i18n/messages";

type ContestWorkspacePageProps = {
  contest: ContestSummary & {
    phase: string;
    canSubmit: boolean;
  };
  problem: ProblemDetail;
  languages?: JudgeLanguage[];
};

const timelineItems = [
  { id: "queued", status: "queued" as const, label: "", labelKey: "contests.workspace.timeline.queued" as const, timestamp: "10:12:01" },
  { id: "compiling", status: "compiling" as const, label: "", labelKey: "contests.workspace.timeline.compiling" as const, timestamp: "10:12:04" },
  { id: "running", status: "running" as const, label: "", labelKey: "contests.workspace.timeline.running" as const, timestamp: "10:12:08" },
];

const testPoints = [
  { index: 1, status: "accepted" as const, score: 10 },
  { index: 2, status: "accepted" as const, score: 10 },
  { index: 3, status: "running" as const, score: 0 },
  { index: 4, status: "queued" as const, score: 0 },
  { index: 5, status: "queued" as const, score: 0 },
  { index: 6, status: "queued" as const, score: 0 },
];

const contestStatusLabel: Record<ContestStatus, MessageKey> = {
  scheduled: "contests.status.scheduled",
  running: "contests.status.running",
  frozen: "contests.status.frozen",
  ended: "contests.status.ended",
  unsealed: "contests.status.unsealed",
};

function formatMemory(value: number) {
  return `${Math.round(value / 1024)} MB`;
}

export function ContestWorkspacePage({ contest, problem, languages: initialLanguages = [] }: ContestWorkspacePageProps) {
  const { t } = useI18n();
  const [languages, setLanguages] = useState<JudgeLanguage[]>(initialLanguages);
  const [languageError, setLanguageError] = useState<string>();
  const apiMode = getApiMode();
  const contestProblem = contest.problems.find((item) => item.problemId === problem.id);
  const alias = contestProblem?.alias ?? "A";
  const freezeLabel = contest.status === "frozen" ? t("contests.workspace.rankUpdatesHidden") : t("contests.workspace.rankUpdatesLive");
  const sample = problem.examples[0];
  const [workspace, setWorkspace] = useState<{ languageId?: number; sourceCode: string }>({
    languageId: languages[0]?.id,
    sourceCode: "",
  });
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success"; submissionId: number }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const hasSession = useBrowserSessionAvailable();
  const locallyRegistered = useLocalContestRegistration(contest.id, apiMode === "mock");
  const needsSession = apiMode === "http" && !hasSession;
  const lifecycleAllowsSubmit = contest.status === "running" || contest.status === "frozen";
  const effectiveCanSubmit = contest.canSubmit || (apiMode === "mock" && locallyRegistered && lifecycleAllowsSubmit);
  const canSubmit = !needsSession && effectiveCanSubmit && Boolean(workspace.languageId && workspace.sourceCode.trim()) && submitState.status !== "pending";

  useEffect(() => {
    if (initialLanguages.length > 0) return;

    listEnabledLanguages(createBrowserApiClient())
      .then((result) => {
        setLanguages(result.items);
        setLanguageError(undefined);
      })
      .catch((error: unknown) => {
        setLanguages([]);
        setLanguageError(error instanceof Error ? error.message : t("contests.workspace.languageCatalogError"));
      });
  }, [initialLanguages.length, t]);

  const handleSubmit = useCallback(async () => {
    if (needsSession || !workspace.languageId || !workspace.sourceCode.trim() || !effectiveCanSubmit) return;

    setSubmitState({ status: "pending" });
    try {
      const submission = await createBrowserApiClient().submissions.create({
        problemId: problem.id,
        contestId: contest.id,
        languageId: workspace.languageId,
        sourceCode: workspace.sourceCode,
      });
      setSubmitState({ status: "success", submissionId: submission.id });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : t("submissions.loading.error"),
      });
    }
  }, [contest.id, effectiveCanSubmit, needsSession, problem.id, t, workspace.languageId, workspace.sourceCode]);

  return (
    <div className="grid gap-6">
      <section className="soj-workspace-stage soj-scanline soj-enter p-5 md:p-7">
        <div className="relative z-[1] grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
          <div className="grid content-between gap-7">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <LocalizedLink
                  className="rounded-full border border-soj-line/70 bg-soj-bg/34 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-soj-muted transition hover:border-soj-accent/60 hover:text-soj-accent focus-visible:outline-soj-accent"
                  href={`/contests/${contest.id}`}
                >
                  {t("contests.workspace.back")}
                </LocalizedLink>
                <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                  {t("contests.workspace.problem", { alias })}
                </span>
                <StatusPill tone={contest.type === "acm" ? "info" : "warning"}>{t(contest.type === "acm" ? "status.acm" : "status.oi")}</StatusPill>
                <StatusPill tone={contest.status === "frozen" ? "warning" : "accent"}>{t(contestStatusLabel[contest.status])}</StatusPill>
              </div>
              <div className="grid gap-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">{problem.title}</h1>
                <p className="max-w-2xl text-base leading-7 text-soj-muted">
                  {t("contests.workspace.description", { contest: contest.title })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [t("contests.workspace.time"), `${problem.timeLimitMs} ms`],
                [t("contests.workspace.memory"), formatMemory(problem.memoryLimitKb)],
                [t("contests.workspace.tags"), t("contests.workspace.lanes", { count: problem.tags.length })],
              ].map(([label, value]) => (
                <div key={label} className="soj-submission-metric">
                  <p className="text-xs text-soj-muted">{label}</p>
                  <p className="mt-1 font-mono text-lg text-soj-text">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="soj-workspace-console grid content-between gap-5 p-5">
            <ContestClock label={contest.status === "frozen" ? t("contest.freezeActive") : t("contest.freezeIn")} value="00:47:18" frozen={contest.status === "frozen"} />
            <div className="grid grid-cols-2 gap-2">
              <div className="soj-submission-chip">
                <span>{t("contests.workspace.submit")}</span>
                <strong>{effectiveCanSubmit ? t("status.open") : t("contests.workspace.blocked")}</strong>
              </div>
              <div className="soj-submission-chip">
                <span>{t("contests.workspace.rank")}</span>
                <strong>{freezeLabel}</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]">
        <section className="soj-workspace-paper grid content-start gap-6 p-5 md:p-6">
          <article className="grid gap-6 text-soj-text">
            <section className="grid gap-2">
              <h2 className="text-xl font-semibold">{t("contests.workspace.statement")}</h2>
              <p className="leading-7 text-soj-muted">{problem.statement}</p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="soj-workspace-note">
                <h2 className="text-lg font-semibold">{t("contests.workspace.input")}</h2>
                <p className="mt-2 leading-7 text-soj-muted">{problem.input}</p>
              </div>
              <div className="soj-workspace-note">
                <h2 className="text-lg font-semibold">{t("contests.workspace.output")}</h2>
                <p className="mt-2 leading-7 text-soj-muted">{problem.output}</p>
              </div>
            </section>

            {sample ? (
              <section className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{t("contests.workspace.sample")}</h2>
                  <StatusPill tone="neutral">{t("contests.workspace.visible")}</StatusPill>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">{t("contests.workspace.input")}</p>
                    <pre className="soj-workspace-sample">
                      <code>{sample.input}</code>
                    </pre>
                  </div>
                  <div className="grid gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">{t("contests.workspace.output")}</p>
                    <pre className="soj-workspace-sample">
                      <code>{sample.output}</code>
                    </pre>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3">
              <h2 className="text-xl font-semibold">{t("contests.workspace.constraints")}</h2>
              <div className="flex flex-wrap gap-2">
                {problem.constraints.map((item) => (
                  <span key={item} className="rounded-full border border-soj-line/65 bg-soj-bg/28 px-3 py-1.5 font-mono text-xs text-soj-muted">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          </article>
        </section>

        <aside className="grid min-w-0 gap-6 xl:sticky xl:top-24">
          <section className="soj-workspace-editor grid content-start gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-soj-text">{t("contests.workspace.solveLoop")}</h2>
                <p className="mt-1 text-sm text-soj-muted">{t("contests.workspace.solveLoopDescription")}</p>
              </div>
              <StatusPill tone={effectiveCanSubmit ? "accent" : "danger"}>{effectiveCanSubmit ? t("status.live") : t("contests.workspace.review")}</StatusPill>
            </div>
            {languageError ? (
              <p className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/10 px-3 py-2 text-sm text-soj-muted">{languageError}</p>
            ) : null}
            {!languageError && languages.length === 0 ? (
              <p className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/10 px-3 py-2 text-sm text-soj-muted">
                {t("contests.workspace.languageCatalogEmpty")}
              </p>
            ) : null}
            <CodeWorkspace
              languages={languages}
              onChange={setWorkspace}
              value={`#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  // Build the signal graph and keep the shortest confirmed route.
  return 0;
}`}
            />
            <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <p className="text-sm leading-6 text-soj-muted">
                {contest.status === "frozen" ? t("contests.workspace.frozenHint") : t("contests.workspace.penaltyHint")}
              </p>
              <Button disabled={!canSubmit} size="lg" className="w-full sm:w-auto" onClick={handleSubmit}>
                {needsSession ? t("contests.workspace.signInToSubmit") : submitState.status === "pending" ? t("contests.workspace.submitting") : t("contests.workspace.submitSolution")}
              </Button>
            </div>
            {needsSession ? (
              <p className="text-sm text-soj-muted">
                <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                  {t("contests.registration.signIn")}
                </LocalizedLink>{" "}
                {t("contests.workspace.signInHint")}
              </p>
            ) : null}
            <ContestSubmissionResult state={submitState} t={t} />
          </section>

          <section aria-label={t("contests.workspace.judgeFeedback")} className="soj-workspace-panel grid content-start gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t("contests.workspace.judgeFeedback")}</h2>
                <p className="mt-1 text-sm text-soj-muted">{t("contests.workspace.judgeFeedbackDescription")}</p>
              </div>
              <StatusPill tone="accent">{t("status.running")}</StatusPill>
            </div>
            <SubmissionTimeline items={timelineItems} />
          </section>

          <section className="soj-workspace-panel grid content-start gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t("contests.workspace.testPoints")}</h2>
                <p className="mt-1 text-sm text-soj-muted">{t("contests.workspace.testPointsDescription")}</p>
              </div>
              <StatusPill tone="warning">{t("contests.workspace.queue", { count: 3 })}</StatusPill>
            </div>
            <TestPointMatrix points={testPoints} />
          </section>

          <SignalFeed
            items={[
              { id: "rank", label: t("contests.workspace.rankImpact"), value: t("contests.workspace.rankImpactValue"), tone: "accent" },
              { id: "penalty", label: t("contests.workspace.currentPenalty"), value: "312", tone: "neutral" },
              { id: "queue", label: t("contests.workspace.judgeQueue"), value: t("contests.workspace.ahead", { count: 3 }), tone: "warning" },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function browserHasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(restoreSession(window.localStorage));
}

function browserUserKey() {
  if (typeof window === "undefined") return null;
  return contestRegistrationUserKey(restoreSession(window.localStorage)?.user);
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

function ContestSubmissionResult({
  state,
  t,
}: {
  state:
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success"; submissionId: number }
    | { status: "error"; message: string };
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}) {
  if (state.status === "idle") return null;

  if (state.status === "success") {
    return (
      <p className="text-sm text-soj-muted">
        {t("contests.workspace.submissionQueued")} {" "}
        <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href={`/submissions/${state.submissionId}`}>
          {t("contests.workspace.viewDetails")}
        </LocalizedLink>
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-soj-danger">{state.message}</p>;
  }

  return <p className="text-sm text-soj-muted">{t("contests.workspace.sending")}</p>;
}
