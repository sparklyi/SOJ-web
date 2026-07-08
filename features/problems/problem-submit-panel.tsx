"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { getAcceptanceRate } from "@/lib/domain/problem";
import { CodeWorkspace } from "@/components/soj/code-workspace";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";

type ProblemSubmitPanelProps = {
  problem: ProblemDetail;
  languages: JudgeLanguage[];
};

export function ProblemSubmitPanel({ problem, languages }: ProblemSubmitPanelProps) {
  const acceptance = getAcceptanceRate(problem);
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
  const needsSession = getApiMode() === "http" && !hasSession;
  const canSubmit = !needsSession && Boolean(workspace.languageId && workspace.sourceCode.trim()) && submitState.status !== "pending";

  const handleSubmit = useCallback(async () => {
    if (needsSession || !workspace.languageId || !workspace.sourceCode.trim()) return;

    setSubmitState({ status: "pending" });
    try {
      const submission = await createBrowserApiClient().submissions.create({
        problemId: problem.id,
        languageId: workspace.languageId,
        sourceCode: workspace.sourceCode,
      });
      setSubmitState({ status: "success", submissionId: submission.id });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Submission failed.",
      });
    }
  }, [needsSession, problem.id, workspace.languageId, workspace.sourceCode]);

  return (
    <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
      <section className="soj-submit-console p-4">
        <div className="relative z-[1] flex items-start justify-between gap-3 border-b border-soj-line/55 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-soj-text">Submit</h2>
            <p className="mt-1 text-sm leading-6 text-soj-muted">Use the workspace for a quick public run.</p>
          </div>
          <ProblemStatus status={problem.status} />
        </div>
        <dl className="relative z-[1] mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Acceptance</dt>
            <dd className="mt-1 font-mono text-soj-text">{acceptance.toFixed(1)}%</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Submissions</dt>
            <dd className="mt-1 font-mono text-soj-text">{problem.submissionCount}</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Time</dt>
            <dd className="mt-1 font-mono text-soj-text">{problem.timeLimitMs} ms</dd>
          </div>
          <div className="rounded-soj-md border border-soj-line/45 bg-soj-bg/24 p-3">
            <dt className="text-soj-muted">Memory</dt>
            <dd className="mt-1 font-mono text-soj-text">{Math.round(problem.memoryLimitKb / 1024)} MB</dd>
          </div>
        </dl>
        <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <StatusPill key={tag}>{tag}</StatusPill>
          ))}
        </div>
      </section>
      <CodeWorkspace languages={languages} onChange={setWorkspace} />
      <Button type="button" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {needsSession ? "Sign in to submit" : submitState.status === "pending" ? "Submitting..." : "Submit solution"}
      </Button>
      {needsSession ? (
        <p className="text-sm text-soj-muted">
          <Link className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
            Sign in
          </Link>{" "}
          to submit with your account.
        </p>
      ) : null}
      <SubmissionResult state={submitState} />
    </aside>
  );
}

function browserHasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(restoreSession(window.localStorage));
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

function SubmissionResult({
  state,
}: {
  state:
    | { status: "idle" }
    | { status: "pending" }
    | { status: "success"; submissionId: number }
    | { status: "error"; message: string };
}) {
  if (state.status === "idle") return null;

  if (state.status === "success") {
    return (
      <p className="text-sm text-soj-muted">
        Submission queued.{" "}
        <Link className="text-soj-accent underline-offset-4 hover:underline" href={`/submissions/${state.submissionId}`}>
          View details
        </Link>
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-soj-danger">{state.message}</p>;
  }

  return <p className="text-sm text-soj-muted">Sending source to judge...</p>;
}
