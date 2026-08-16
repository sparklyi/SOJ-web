"use client";

import { useCallback, useEffect, useState } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { createBrowserApiClient } from "@/lib/api/client";
import type { ProblemAuthoringState, ProblemStatementInput, ProblemUpdateInput } from "@/lib/api/types";
import { ProblemMetadataForm, ProblemStatementForm, TestcaseUploadForm } from "./problem-authoring-form";
import { ProblemCheckPanel } from "./problem-check-panel";
import { publicationStatusMessageKey } from "./publication-status";

type WorkbenchState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProblemAuthoringState };

export function ProblemWorkbench({ problemId }: { problemId: number }) {
  const { status: authStatus } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState<WorkbenchState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const viewState: WorkbenchState = authStatus === "loading" ? { status: "loading" } : authStatus === "anonymous" ? { status: "auth" } : state;

  const load = useCallback(async () => {
    const data = await createBrowserApiClient().problems.getAuthoringState(problemId);
    setState({ status: "ready", data });
  }, [problemId]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;

    async function start() {
      try {
        await load();
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("authoring.unableLoadState") });
      }
    }
    void start();

    return () => {
      active = false;
    };
  }, [authStatus, load, t]);

  async function command(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await load();
      setMessage({ tone: "success", text: success });
    } catch (cause) {
      setMessage({ tone: "danger", text: cause instanceof Error ? cause.message : t("authoring.commandFailed") });
    } finally {
      setBusy(false);
    }
  }

  if (viewState.status !== "ready") {
    return (
      <PageShell>
        <section className="soj-account-panel grid gap-4 p-6">
          <h1 className="text-2xl font-semibold text-soj-text">{viewState.status === "auth" ? t("authoring.authRequired") : viewState.status === "error" ? t("authoring.unableOpenProblem") : t("authoring.loadingWorkspace")}</h1>
          {viewState.status === "auth" ? <LocalizedLink className="text-sm text-soj-accent" href="/auth/login">{t("authoring.openLogin")}</LocalizedLink> : null}
          {viewState.status === "error" ? <p className="text-sm text-soj-danger">{viewState.message}</p> : null}
        </section>
      </PageShell>
    );
  }

  const data = viewState.data;
  const client = () => createBrowserApiClient().problems;

  return (
    <PageShell>
      <div className="grid gap-6">
        <header className="grid gap-4 border-b border-soj-line/70 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <LocalizedLink className="font-mono text-xs text-soj-accent" href="/manage/problems">{t("authoring.console")}</LocalizedLink>
              <StatusPill tone={data.problem.publicationStatus === "published" ? "success" : "warning"}>{t(publicationStatusMessageKey(data.problem.publicationStatus))}</StatusPill>
            </div>
            <h1 className="mt-3 break-words text-4xl font-semibold text-soj-text md:text-5xl">{data.problem.title}</h1>
            <p className="mt-2 font-mono text-xs text-soj-muted">{data.problem.slug} / P{data.problem.id}</p>
          </div>
          {data.problem.publicationStatus === "published" ? <LocalizedLink className="text-sm text-soj-accent" href={`/problems/${data.problem.id}`}>{t("authoring.openProblem")}</LocalizedLink> : null}
        </header>

        {message ? <p className={message.tone === "success" ? "text-sm text-soj-success" : "text-sm text-soj-danger"} role="status">{message.text}</p> : null}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            <ProblemMetadataForm key={`${data.problem.id}-${data.problem.title}-${data.problem.tags.join(",")}`} state={data} busy={busy} onSave={(input: ProblemUpdateInput) => command(() => client().update(problemId, input), t("authoring.problemSettingsSaved"))} />
            <ProblemStatementForm key={`${data.problem.id}-${data.statement?.version ?? 0}`} state={data} busy={busy} onSave={(input: ProblemStatementInput) => command(() => client().saveStatement(problemId, input), t("authoring.statementVersionSaved"))} />
          </div>
          <aside className="grid gap-6 xl:sticky xl:top-24">
            <TestcaseUploadForm busy={busy} onUpload={(input) => command(() => client().uploadTestcases(problemId, input), t("authoring.testcaseArchiveUploaded"))} />
            {data.testcaseSet ? (
              <section className="soj-account-panel grid grid-cols-2 gap-3 p-5">
                <DataPoint label={t("authoring.version")} value={`v${data.testcaseSet.version}`} />
                <DataPoint label={t("authoring.cases")} value={String(data.testcaseSet.caseCount)} />
                <DataPoint label={t("authoring.size")} value={`${Math.max(1, Math.round(data.testcaseSet.sizeBytes / 1024))} KB`} />
                <DataPoint label={t("authoring.status")} value={testcaseStatusLabel(t, data.testcaseSet.status)} />
              </section>
            ) : null}
            <ProblemCheckPanel
              state={data}
              busy={busy}
              onRunCheck={() => command(() => client().runCheck(problemId), t("authoring.validationCompleted"))}
              onSubmitReview={() => command(() => client().submitReview(problemId), t("authoring.reviewSubmitted"))}
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

function testcaseStatusLabel(t: ReturnType<typeof useI18n>["t"], status: NonNullable<ProblemAuthoringState["testcaseSet"]>["status"]) {
  if (status === "uploading") return t("authoring.testcaseStatus.uploading");
  if (status === "disabled") return t("authoring.testcaseStatus.disabled");
  return t("authoring.testcaseStatus.ready");
}
