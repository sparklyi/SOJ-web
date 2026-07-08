import Link from "next/link";
import { SignalFeed, type SignalFeedItem } from "@/components/soj/signal-feed";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import type { JudgeStatus } from "@/lib/api/types";
import { buildSubmissionTimeline, type SubmissionTone } from "@/lib/domain/submission";
import type { getSubmission } from "./api";
import { SubmissionImpact } from "./submission-impact";

type SubmissionDetailProps = {
  submission: Awaited<ReturnType<typeof getSubmission>>;
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatRuntime(value?: number) {
  return typeof value === "number" ? `${value} ms` : "Pending";
}

function formatMemory(value?: number) {
  return typeof value === "number" ? `${value} KB` : "Pending";
}

function contestLabel(contestId?: number) {
  return contestId ? "SOJ Signal Cup" : "Practice";
}

function signalTone(tone: SubmissionTone): SignalFeedItem["tone"] {
  return tone === "info" ? "neutral" : tone;
}

function statusPoints(status: JudgeStatus, score: number) {
  if (status === "accepted") {
    return Array.from({ length: 8 }, (_, index) => ({ index: index + 1, status, score: 12.5 }));
  }

  if (status === "wrong_answer") {
    return Array.from({ length: 8 }, (_, index) => ({
      index: index + 1,
      status: (index < 3 ? "accepted" : index === 3 ? "wrong_answer" : "queued") as JudgeStatus,
      score: index < 3 ? 10 : index === 3 ? 5 : 0,
    }));
  }

  if (status === "running") {
    return Array.from({ length: 8 }, (_, index) => ({
      index: index + 1,
      status: (index < 2 ? "accepted" : index < 5 ? "running" : "queued") as JudgeStatus,
      score: index < 2 ? 12 : 0,
    }));
  }

  if (status === "compiling" || status === "queued") {
    return Array.from({ length: 8 }, (_, index) => ({ index: index + 1, status, score: 0 }));
  }

  return Array.from({ length: 8 }, (_, index) => ({
    index: index + 1,
    status,
    score: index === 0 ? score : 0,
  }));
}

function timelineItems(submission: SubmissionDetailProps["submission"]) {
  const time = formatSubmittedAt(submission.submittedAt);
  return buildSubmissionTimeline(submission).map((state) => ({
    id: state.status,
    status: state.status,
    label: state.label,
    timestamp: state.status === "queued" || state.terminal ? time : undefined,
  }));
}

function feedbackLine(status: JudgeStatus) {
  const lines: Record<JudgeStatus, string> = {
    queued: "Waiting for an available judge worker.",
    compiling: "Compiler is preparing the submitted source.",
    running: "Judge worker is executing visible and hidden tests.",
    accepted: "All test points passed within limits.",
    wrong_answer: "Mismatch at point 4.",
    runtime_error: "Runtime terminated before producing a valid answer.",
    compile_error: "Compiler rejected the submitted source.",
    time_limit: "Execution exceeded the configured time limit.",
    memory_limit: "Execution exceeded the configured memory limit.",
    canceled: "Judging was canceled before completion.",
    system_error: "Judge worker reported an internal system error.",
  };
  return lines[status];
}

function runtimeItems(submission: SubmissionDetailProps["submission"]): SignalFeedItem[] {
  return [
    { id: "score", label: "Score", value: String(submission.score), tone: signalTone(submission.displayState.tone) },
    { id: "time", label: "Time", value: formatRuntime(submission.timeMs), tone: "neutral" },
    { id: "memory", label: "Memory", value: formatMemory(submission.memoryKb), tone: "neutral" },
    { id: "compile", label: "Compile", value: submission.status === "compile_error" ? "Failed" : "Ready", tone: submission.status === "compile_error" ? "warning" : "success" },
    { id: "runtime", label: "Runtime", value: submission.status === "runtime_error" ? "Aborted" : feedbackLine(submission.status), tone: submission.status === "runtime_error" ? "danger" : "neutral" },
    { id: "system", label: "System", value: submission.status === "system_error" ? "Judge error" : "Nominal", tone: submission.status === "system_error" ? "danger" : "neutral" },
  ];
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const resources = [
    { label: "Score", value: String(submission.score), tone: "text-soj-accent" },
    { label: "Time", value: formatRuntime(submission.timeMs), tone: "text-soj-muted" },
    { label: "Memory", value: formatMemory(submission.memoryKb), tone: "text-soj-muted" },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="soj-submission-detail-stage soj-scanline soj-enter p-5 md:p-7">
        <div className="relative z-[1] grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
          <div className="grid content-between gap-7">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full border border-soj-line/70 bg-soj-bg/34 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-soj-muted transition hover:border-soj-accent/60 hover:text-soj-accent focus-visible:outline-soj-accent"
                  href="/submissions"
                >
                  Back
                </Link>
                <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                  Run dossier
                </span>
                <span className="font-mono text-xs text-soj-muted">{formatSubmittedAt(submission.submittedAt)}</span>
              </div>
              <div className="grid gap-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">Submission #{submission.id}</h1>
                <p className="max-w-2xl text-base leading-7 text-soj-muted">
                  {submission.problemTitle} routed through {contestLabel(submission.contestId)} with judge feedback and resource traces.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {resources.map((item) => (
                <div key={item.label} className="soj-submission-metric">
                  <p className="text-xs text-soj-muted">{item.label}</p>
                  <p className={`mt-1 font-mono text-xl ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="soj-submission-result-panel grid content-between gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">Verdict</p>
                <p className="mt-2 text-2xl font-semibold text-soj-text">{submission.displayState.label}</p>
              </div>
              <VerdictBadge status={submission.status} />
            </div>
            <div className="soj-submission-result-line" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="soj-submission-chip">
                <span>Problem</span>
                <strong>P{submission.problemId}</strong>
              </div>
              <div className="soj-submission-chip">
                <span>Route</span>
                <strong>{submission.contestId ? "Contest" : "Practice"}</strong>
              </div>
            </div>
            <p className="border-t border-soj-line/60 pt-4 text-sm leading-6 text-soj-muted">{feedbackLine(submission.status)}</p>
          </aside>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section aria-label="Judge lifecycle" className="soj-submission-detail-panel grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">Judge lifecycle</h2>
            <p className="mt-1 text-sm text-soj-muted">Pipeline checkpoints for this run.</p>
          </div>
          <SubmissionTimeline items={timelineItems(submission)} />
        </section>

        <section aria-label="Test point matrix" className="soj-submission-detail-panel grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">Test point matrix</h2>
            <p className="mt-1 text-sm text-soj-muted">Visible sample of point states and partial scoring.</p>
          </div>
          <TestPointMatrix points={statusPoints(submission.status, submission.score)} />
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Runtime and system information" className="soj-submission-detail-panel grid content-start grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <div>
            <h2 className="text-xl font-semibold">Runtime and system information</h2>
            <p className="mt-1 text-sm text-soj-muted">Compiler, sandbox, and worker signals.</p>
          </div>
          <SignalFeed items={runtimeItems(submission)} />
        </section>
        <SubmissionImpact submission={submission} />
      </div>
    </div>
  );
}
