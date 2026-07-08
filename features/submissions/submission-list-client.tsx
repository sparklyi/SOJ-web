"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/layout/top-nav";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { createBrowserApiClient } from "@/lib/api/client";
import { listSubmissions } from "./api";
import { SubmissionList } from "./submission-list";

type SubmissionListResult = Awaited<ReturnType<typeof listSubmissions>>;

type SubmissionListState =
  | { status: "loading" }
  | { status: "ready"; submissions: SubmissionListResult }
  | { status: "auth" }
  | { status: "error"; message: string };

export function SubmissionListClient() {
  const [state, setState] = useState<SubmissionListState>({ status: "loading" });

  useEffect(() => {
    listSubmissions(createBrowserApiClient())
      .then((submissions) => setState({ status: "ready", submissions }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to load submissions.";
        if (message.toLowerCase().includes("auth")) {
          setState({ status: "auth" });
          return;
        }
        setState({ status: "error", message });
      });
  }, []);

  const submissions = state.status === "ready" ? state.submissions : { items: [], total: 0 };
  const latest = submissions.items[0];
  const acceptedCount = submissions.items.filter((item) => item.status === "accepted").length;
  const inFlightCount = submissions.items.filter((item) => !item.displayState.terminal).length;
  const terminalCount = submissions.items.filter((item) => item.displayState.terminal).length;
  const metrics = [
    { label: "Total runs", value: submissions.total, tone: "text-soj-text" },
    { label: "Accepted", value: acceptedCount, tone: "text-soj-success" },
    { label: "In flight", value: inFlightCount, tone: "text-soj-accent" },
    { label: "Terminal", value: terminalCount, tone: "text-soj-muted" },
  ];
  const judgeTrack = [
    { label: "Queue", caption: "intake", value: submissions.items.filter((item) => item.status === "queued").length },
    { label: "Compile", caption: "build", value: submissions.items.filter((item) => item.status === "compiling").length },
    { label: "Run", caption: "sandbox", value: submissions.items.filter((item) => item.status === "running").length },
    { label: "Verdict", caption: "sealed", value: terminalCount },
  ];

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <section className="soj-submission-stage soj-scanline soj-enter p-5 md:p-7">
          <div className="relative z-[1] grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className="grid content-between gap-7">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                    Judge Signal
                  </span>
                  <span className="font-mono text-xs text-soj-muted">{submissions.total} runs routed through SOJ</span>
                </div>
                <div className="grid gap-3">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">Submissions</h1>
                  <p className="max-w-2xl text-base leading-7 text-soj-muted">
                    Track judge intake, resource usage, and final verdicts without leaving the Web workspace.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {metrics.map(({ label, value, tone }) => (
                  <div key={label} className="soj-submission-metric">
                    <p className="text-xs text-soj-muted">{label}</p>
                    <p className={`mt-1 font-mono text-2xl ${tone}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {latest ? <LatestSubmissionCard latest={latest} /> : <SubmissionEmptyCard state={state} />}
          </div>
        </section>

        <section className="soj-judge-track" aria-label="Judge pipeline">
          {judgeTrack.map(({ label, caption, value }, index) => (
            <div key={label} className="soj-judge-segment">
              <span className="font-mono text-[11px] text-soj-muted">0{index + 1}</span>
              <div>
                <p className="text-sm font-semibold text-soj-text">{label}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">{caption}</p>
              </div>
              <strong className="font-mono text-lg text-soj-accent">{value}</strong>
            </div>
          ))}
        </section>

        {state.status === "ready" ? <SubmissionList submissions={submissions.items} /> : <SubmissionLoadState state={state} />}
      </main>
    </div>
  );
}

function LatestSubmissionCard({ latest }: { latest: SubmissionListResult["items"][number] }) {
  return (
    <aside className="soj-submission-latest grid content-start gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Latest run</p>
          <p className="mt-2 font-mono text-4xl text-soj-text">#{latest.id}</p>
        </div>
        <VerdictBadge status={latest.status} />
      </div>
      <div className="grid gap-2">
        <p className="text-lg font-semibold text-soj-text">{latest.problemTitle}</p>
        <div className="flex items-center justify-between border-t border-soj-line/60 pt-3 font-mono text-xs text-soj-muted">
          <span>P{latest.problemId}</span>
          <span>{latest.score} pts</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="soj-submission-chip">
          <span>Route</span>
          <strong>{latest.contestId ? "Contest" : "Practice"}</strong>
        </div>
        <div className="soj-submission-chip">
          <span>State</span>
          <strong>{latest.displayState.terminal ? "sealed" : "live"}</strong>
        </div>
      </div>
    </aside>
  );
}

function SubmissionEmptyCard({ state }: { state: SubmissionListState }) {
  const label = state.status === "loading" ? "Loading runs" : state.status === "auth" ? "Sign in required" : "No visible runs";
  return (
    <aside className="soj-submission-latest grid content-start gap-5 p-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Latest run</p>
        <p className="mt-2 text-2xl font-semibold text-soj-text">{label}</p>
      </div>
      <p className="text-sm leading-6 text-soj-muted">Submission history is loaded with your browser session so backend visibility rules stay intact.</p>
      {state.status === "auth" ? (
        <LoginLink />
      ) : null}
    </aside>
  );
}

function SubmissionLoadState({ state }: { state: SubmissionListState }) {
  const title = state.status === "loading" ? "Loading judge queue" : state.status === "auth" ? "Login required" : "Unable to load submissions";
  const message =
    state.status === "loading"
      ? "Reading visible submissions with your browser session."
      : state.status === "auth"
        ? "The backend submission list is protected. Login first, then return here."
        : state.status === "error"
          ? state.message
          : "Submission list is ready.";

  return (
    <section className="soj-submission-board p-6">
      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-soj-text">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-soj-muted">{message}</p>
        {state.status === "auth" ? (
          <div>
            <LoginLink />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LoginLink() {
  return (
    <Link
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-soj-md border border-soj-accent/80 bg-soj-accent px-3 text-xs font-medium text-soj-bg shadow-[0_10px_30px_rgb(var(--soj-accent)/0.18),inset_0_1px_0_rgb(255_255_255/0.26)] transition duration-200 ease-out hover:bg-soj-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent active:translate-y-px"
      href="/auth/login"
    >
      Login
    </Link>
  );
}
