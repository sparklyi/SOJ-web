"use client";

import { useCallback, useEffect, useState } from "react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AuthoringProblem, ProblemReviewEvent, ReviewDecision } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import { decideProblemReview, listProblemReviewEvents, listProblemReviewQueue } from "./api";

type QueueState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; problems: AuthoringProblem[] };

export function ReviewWorkspace() {
  const { t } = useI18n();

  return (
    <PageShell title={t("review.title")} description={t("review.description")}>
      <PermissionGate anyOf={["problem.review", "problem.manage_all"]}>
        <ReviewQueue />
      </PermissionGate>
    </PageShell>
  );
}

function ReviewQueue() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [state, setState] = useState<QueueState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eventState, setEventState] = useState<{ problemId: number; events: ProblemReviewEvent[] } | null>(null);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState<ReviewDecision | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const result = await listProblemReviewQueue(createBrowserApiClient());
      setState({ status: "ready", problems: result.items });
      setSelectedId((current) => (current && result.items.some((problem) => problem.id === current) ? current : (result.items[0]?.id ?? null)));
    } catch (cause) {
      setState({ status: "error", message: cause instanceof Error ? cause.message : t("review.decisionFailed") });
    }
  }, [t]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listProblemReviewQueue(createBrowserApiClient());
        if (!active) return;
        setState({ status: "ready", problems: result.items });
        setSelectedId((current) => (current && result.items.some((problem) => problem.id === current) ? current : (result.items[0]?.id ?? null)));
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("review.decisionFailed") });
      }
    }

    void start();

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (selectedId === null) return;

    let active = true;
    const problemId = selectedId;

    listProblemReviewEvents(problemId, createBrowserApiClient())
      .then((result) => {
        if (active) setEventState({ problemId, events: result });
      })
      .catch(() => {
        if (active) setEventState({ problemId, events: [] });
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  // Events are keyed by problem so a stale response for a previous selection is
  // never rendered against the current one.
  const events = eventState && eventState.problemId === selectedId ? eventState.events : [];

  async function submitDecision(decision: ReviewDecision) {
    if (selectedId === null) return;
    setPending(decision);
    setFeedback(null);
    try {
      await decideProblemReview(selectedId, decision, comment.trim(), createBrowserApiClient());
      setComment("");
      setFeedback({ tone: "success", message: decision === "approve" ? t("review.decisionApproved") : t("review.decisionSentBack") });
      await loadQueue();
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("review.decisionFailed") });
    } finally {
      setPending(null);
    }
  }

  if (state.status === "loading") {
    return <BoardState message={t("status.pending")} />;
  }

  if (state.status === "error") {
    return <BoardState message={state.message} tone="danger" />;
  }

  if (state.problems.length === 0) {
    return <BoardState message={t("review.queueEmpty")} />;
  }

  const selected = state.problems.find((problem) => problem.id === selectedId) ?? null;
  const isOwnProblem = Boolean(selected && user && selected.ownerUserId === user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-soj-text">{t("review.queue")}</h2>
        <ul className="grid gap-2">
          {state.problems.map((problem) => (
            <li key={problem.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(problem.id);
                  setFeedback(null);
                }}
                className={
                  problem.id === selectedId
                    ? "w-full rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 px-3 py-2 text-left"
                    : "w-full rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/60 px-3 py-2 text-left transition hover:border-soj-accent/40"
                }
              >
                <span className="block truncate text-sm text-soj-text">{problem.title}</span>
                <span className="mt-1 block font-mono text-xs text-soj-muted">{problem.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0 grid gap-4">
        {selected ? (
          <>
            <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-medium text-soj-text">{selected.title}</h2>
                  <p className="mt-1 font-mono text-xs text-soj-muted">
                    #{selected.id} · {selected.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="info">{t("authoring.publicationStatus.inReview")}</StatusPill>
                  <StatusPill>{selected.visibility}</StatusPill>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-soj-muted">
                <span>
                  {t("home.difficulty")}: <span className="font-mono text-soj-text">{selected.difficulty}</span>
                </span>
                <span>
                  {t("roles.userId")}: <span className="font-mono text-soj-text">{selected.ownerUserId}</span>
                </span>
                <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href={`/manage/problems`}>
                  {t("nav.account.authorProblems")}
                </LocalizedLink>
              </div>

              <div className="mt-5 grid gap-3 border-t border-soj-line/70 pt-5">
                {isOwnProblem ? (
                  <p className="text-sm text-soj-warning">{t("review.selfReviewBlocked")}</p>
                ) : (
                  <>
                    <label className="grid gap-2 text-sm text-soj-text">
                      {t("review.comment")}
                      <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder={t("review.commentPlaceholder")}
                        rows={3}
                        className="rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 py-2 text-sm text-soj-text transition placeholder:text-soj-faint focus:border-soj-accent focus:outline-none focus:ring-1 focus:ring-soj-accent"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button loading={pending === "approve"} onClick={() => void submitDecision("approve")}>
                        {t("review.approve")}
                      </Button>
                      <Button variant="danger" loading={pending === "request_changes"} onClick={() => void submitDecision("request_changes")}>
                        {t("review.requestChanges")}
                      </Button>
                    </div>
                  </>
                )}
                {feedback ? (
                  <p className={feedback.tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-success"}>{feedback.message}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
              <h3 className="mb-3 text-sm font-medium text-soj-text">{t("review.events")}</h3>
              {events.length === 0 ? (
                <p className="text-sm text-soj-muted">{t("review.eventsEmpty")}</p>
              ) : (
                <ol className="grid gap-3">
                  {events.map((event) => (
                    <li key={event.id} className="rounded-soj-md border border-soj-line/60 bg-soj-bg-raised/50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={event.decision === "approve" ? "success" : event.decision === "request_changes" ? "warning" : "info"}>
                          {decisionLabel(event.decision, t)}
                        </StatusPill>
                        <span className="font-mono text-xs text-soj-muted">
                          {event.fromStatus} → {event.toStatus}
                        </span>
                        <span className="font-mono text-xs text-soj-muted">{formatTimestamp(event.createdAt)}</span>
                      </div>
                      {event.comment ? <p className="mt-2 text-sm leading-6 text-soj-muted">{event.comment}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        ) : (
          <BoardState message={t("review.selectPrompt")} />
        )}
      </section>
    </div>
  );
}

const decisionKeys: Record<ProblemReviewEvent["decision"], MessageKey> = {
  submit: "review.decisionSubmit",
  approve: "review.decisionApprove",
  request_changes: "review.decisionRequestChanges",
};

function decisionLabel(decision: ProblemReviewEvent["decision"], t: Translator) {
  return t(decisionKeys[decision]);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 16).replace("T", " ") : value;
}

function BoardState({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "danger" }) {
  return (
    <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 px-6 py-10 text-center text-sm text-soj-muted">
      <span className={tone === "danger" ? "text-soj-danger" : undefined}>{message}</span>
    </div>
  );
}
