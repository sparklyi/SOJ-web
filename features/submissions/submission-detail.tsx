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
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3">
          <Link className="text-sm text-soj-muted transition hover:text-soj-accent focus-visible:outline-soj-accent" href="/submissions">
            Back to submissions
          </Link>
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{submission.problemTitle}</h2>
            <p className="text-sm leading-6 text-soj-muted">Submitted {formatSubmittedAt(submission.submittedAt)} for SOJ Signal Cup.</p>
          </div>
        </div>
        <div className="grid content-start justify-items-start gap-3 lg:justify-items-end">
          <VerdictBadge status={submission.status} />
          <div className="grid grid-cols-3 gap-3 font-mono text-sm">
            <span className="text-soj-muted">Score {submission.score}</span>
            <span className="text-soj-muted">{formatRuntime(submission.timeMs)}</span>
            <span className="text-soj-muted">{formatMemory(submission.memoryKb)}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section aria-label="Judge lifecycle" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <h2 className="text-xl font-semibold">Judge lifecycle</h2>
          <SubmissionTimeline items={timelineItems(submission)} />
        </section>

        <section aria-label="Test point matrix" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <h2 className="text-xl font-semibold">Test point matrix</h2>
          <TestPointMatrix points={statusPoints(submission.status, submission.score)} />
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Runtime and system information" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <h2 className="text-xl font-semibold">Runtime and system information</h2>
          <SignalFeed items={runtimeItems(submission)} />
        </section>
        <SubmissionImpact submission={submission} />
      </div>
    </div>
  );
}
