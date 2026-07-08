"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserApiClient } from "@/lib/api/client";
import { isNotFoundError } from "@/lib/api/errors";
import { getSubmission } from "./api";
import { SubmissionDetail } from "./submission-detail";

type SubmissionDetailState =
  | { status: "loading" }
  | { status: "ready"; submission: Awaited<ReturnType<typeof getSubmission>> }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function SubmissionDetailClient({ submissionId }: { submissionId: number }) {
  const [state, setState] = useState<SubmissionDetailState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    getSubmission(submissionId, createBrowserApiClient())
      .then((submission) => {
        if (active) setState({ status: "ready", submission });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isNotFoundError(error)) {
          setState({ status: "not-found" });
          return;
        }
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load submission.",
        });
      });

    return () => {
      active = false;
    };
  }, [submissionId]);

  if (state.status === "ready") {
    return <SubmissionDetail submission={state.submission} />;
  }

  if (state.status === "not-found") {
    return <SubmissionShell title="Submission not found" message="This submission no longer exists or is not visible to this session." />;
  }

  if (state.status === "error") {
    return <SubmissionShell title="Unable to load submission" message={state.message} />;
  }

  return <SubmissionShell title="Loading submission" message="Reading judge details with your browser session." />;
}

function SubmissionShell({ title, message }: { title: string; message: string }) {
  return (
    <section className="soj-submission-detail-panel grid min-h-72 content-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-soj-text">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-soj-muted">{message}</p>
      </div>
      <div className="flex justify-center gap-3">
        <Link className="rounded-soj-md border border-soj-line/70 px-4 py-2 text-sm text-soj-muted transition hover:border-soj-accent/60 hover:text-soj-accent" href="/submissions">
          Back to submissions
        </Link>
        <Link className="rounded-soj-md border border-soj-accent/70 bg-soj-accent px-4 py-2 text-sm text-soj-bg transition hover:bg-soj-accent/90" href="/auth/login">
          Sign in
        </Link>
      </div>
    </section>
  );
}
