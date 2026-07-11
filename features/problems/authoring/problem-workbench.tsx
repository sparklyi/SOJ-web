"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { StatusPill } from "@/components/soj/status-pill";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";
import type { ProblemAuthoringState, ProblemStatementInput, ProblemUpdateInput } from "@/lib/api/types";
import { ProblemMetadataForm, ProblemStatementForm, TestcaseUploadForm } from "./problem-authoring-form";
import { ProblemCheckPanel } from "./problem-check-panel";

type WorkbenchState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProblemAuthoringState };

export function ProblemWorkbench({ problemId }: { problemId: number }) {
  const [state, setState] = useState<WorkbenchState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const load = useCallback(async () => {
    const data = await createBrowserApiClient().problems.getAuthoringState(problemId);
    setState({ status: "ready", data });
  }, [problemId]);

  useEffect(() => {
    async function start() {
      if (getApiMode() === "http" && !restoreSession(window.localStorage)) {
        setState({ status: "auth" });
        return;
      }
      try {
        await load();
      } catch (cause) {
        setState({ status: "error", message: cause instanceof Error ? cause.message : "Unable to load authoring state." });
      }
    }
    void start();
  }, [load]);

  async function command(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await load();
      setMessage({ tone: "success", text: success });
    } catch (cause) {
      setMessage({ tone: "danger", text: cause instanceof Error ? cause.message : "Command failed." });
    } finally {
      setBusy(false);
    }
  }

  if (state.status !== "ready") {
    return (
      <PageShell>
        <section className="soj-account-panel grid gap-4 p-6">
          <h1 className="text-2xl font-semibold text-soj-text">{state.status === "auth" ? "Login required" : state.status === "error" ? "Unable to open problem" : "Loading problem"}</h1>
          {state.status === "auth" ? <Link className="text-sm text-soj-accent" href="/auth/login">Open login</Link> : null}
          {state.status === "error" ? <p className="text-sm text-soj-danger">{state.message}</p> : null}
        </section>
      </PageShell>
    );
  }

  const data = state.data;
  const client = () => createBrowserApiClient().problems;

  return (
    <PageShell>
      <div className="grid gap-6">
        <header className="grid gap-4 border-b border-soj-line/70 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link className="font-mono text-xs text-soj-accent" href="/manage/problems">Author console</Link>
              <StatusPill tone={data.problem.publicationStatus === "published" ? "success" : "warning"}>{data.problem.publicationStatus}</StatusPill>
            </div>
            <h1 className="mt-3 break-words text-4xl font-semibold text-soj-text md:text-5xl">{data.problem.title}</h1>
            <p className="mt-2 font-mono text-xs text-soj-muted">{data.problem.slug} / P{data.problem.id}</p>
          </div>
          {data.problem.publicationStatus === "published" ? <Link className="text-sm text-soj-accent" href={`/problems/${data.problem.id}`}>Open problem</Link> : null}
        </header>

        {message ? <p className={message.tone === "success" ? "text-sm text-soj-success" : "text-sm text-soj-danger"} role="status">{message.text}</p> : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            <ProblemMetadataForm key={`${data.problem.id}-${data.problem.title}-${data.problem.tags.join(",")}`} state={data} busy={busy} onSave={(input: ProblemUpdateInput) => command(() => client().update(problemId, input), "Problem settings saved.")} />
            <ProblemStatementForm key={`${data.problem.id}-${data.statement?.version ?? 0}`} state={data} busy={busy} onSave={(input: ProblemStatementInput) => command(() => client().saveStatement(problemId, input), "Statement version saved.")} />
          </div>
          <aside className="grid gap-6 xl:sticky xl:top-24">
            <TestcaseUploadForm busy={busy} onUpload={(input) => command(() => client().uploadTestcases(problemId, input), "Testcase archive uploaded.")} />
            {data.testcaseSet ? (
              <section className="soj-account-panel grid grid-cols-2 gap-3 p-5">
                <DataPoint label="Version" value={`v${data.testcaseSet.version}`} />
                <DataPoint label="Cases" value={String(data.testcaseSet.caseCount)} />
                <DataPoint label="Size" value={`${Math.max(1, Math.round(data.testcaseSet.sizeBytes / 1024))} KB`} />
                <DataPoint label="Status" value={data.testcaseSet.status} />
              </section>
            ) : null}
            <ProblemCheckPanel
              state={data}
              busy={busy}
              onRunCheck={() => command(() => client().runCheck(problemId), "Validation completed.")}
              onPublish={() => command(() => client().publish(problemId), "Problem published.")}
            />
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-soj-md border border-soj-line/50 bg-soj-bg/25 px-3 py-3">
      <p className="text-xs text-soj-muted">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-soj-text">{value}</p>
    </div>
  );
}
