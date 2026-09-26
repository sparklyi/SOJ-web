"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWall } from "@/components/auth/auth-wall";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/errors";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AuthoringStepKey, ProblemAuthoringFlow, ProblemAuthoringState, ProblemCreateInput, ProblemStatementInput, TestcaseFinding } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { AuthoringDetails } from "./authoring-details";
import { AuthoringStepper } from "./authoring-stepper";
import { AUTHORING_STEP_KEYS, resolveAuthoringStep } from "./flow";
import { publicationStatusMessageKey } from "./publication-status";
import { CheckStep } from "./steps/check-step";
import { CreateStep } from "./steps/create-step";
import { ReviewStep } from "./steps/review-step";
import { StatementStep } from "./steps/statement-step";
import { TestcaseStep } from "./steps/testcase-step";

type LoadState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProblemAuthoringState };

const CREATE_FLOW: ProblemAuthoringFlow = {
  currentStep: "create",
  remaining: AUTHORING_STEP_KEYS.length,
  steps: AUTHORING_STEP_KEYS.map((key) => ({ key, status: "todo" as const })),
};

type ProblemWizardProps = {
  /** 缺省即为「新建」模式（第一步建题）。 */
  problemId?: number;
  initialStep?: string | null;
};

export function ProblemWizard({ problemId, initialStep }: ProblemWizardProps) {
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const { t, localize } = useI18n();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [findings, setFindings] = useState<TestcaseFinding[]>([]);
  const [warnings, setWarnings] = useState<TestcaseFinding[]>([]);

  const load = useCallback(async () => {
    if (!problemId) return;
    const data = await createBrowserApiClient().problems.getAuthoringState(problemId);
    setState({ status: "ready", data });
  }, [problemId]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !problemId) return;
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
  }, [authStatus, problemId, load, t]);

  const client = useMemo(() => createBrowserApiClient().problems, []);

  async function command(action: () => Promise<unknown>, successKey: MessageKey) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await load();
      setMessage({ tone: "success", text: t(successKey) });
    } catch (cause) {
      setMessage({ tone: "danger", text: cause instanceof Error ? cause.message : t("authoring.commandFailed") });
    } finally {
      setBusy(false);
    }
  }

  async function create(input: ProblemCreateInput) {
    setBusy(true);
    setMessage(null);
    try {
      const problem = await client.create(input);
      router.push(localize(`/manage/problems/${problem.id}?step=statement`));
    } catch (cause) {
      setMessage({ tone: "danger", text: cause instanceof Error ? cause.message : t("authoring.unableCreateProblem") });
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (!problemId) return;
    setBusy(true);
    setMessage(null);
    setFindings([]);
    setWarnings([]);
    try {
      const uploaded = await client.uploadTestcases(problemId, { archive: file });
      setWarnings(uploaded.warnings);
      await load();
      setMessage({ tone: "success", text: t("authoring.testcaseArchiveUploaded") });
    } catch (cause) {
      if (cause instanceof ApiError && cause.details?.findings && cause.details.findings.length > 0) {
        setFindings(cause.details.findings);
        setMessage({ tone: "danger", text: cause.message });
      } else {
        setMessage({ tone: "danger", text: cause instanceof Error ? cause.message : t("authoring.commandFailed") });
      }
    } finally {
      setBusy(false);
    }
  }

  function selectStep(step: AuthoringStepKey) {
    if (problemId) router.replace(localize(`/manage/problems/${problemId}?step=${step}`));
  }

  // 未登录 / 会话加载中：无论建题还是编辑都先过登录门。
  if (authStatus === "loading") {
    return <GateShell title={t("authoring.loadingWorkspace")} />;
  }
  if (authStatus === "anonymous") {
    return (
      <GateShell title={t("authoring.authRequired")}>
        <AuthWall title={t("gate.signInRequired")} body={t("gate.signInBody")} actionHref="/auth/login" actionLabel={t("gate.signIn")} />
      </GateShell>
    );
  }

  /* ---------- 新建模式：只有第一步建题 ---------- */
  if (!problemId) {
    return (
      <PageShell>
        <div className="grid gap-6">
          <PageHeader eyebrow={t("authoring.console")} title={t("authoring.createProblem")} description={t("authoring.create.description")} />
          <AuthoringStepper flow={CREATE_FLOW} current="create" onSelect={selectStep} />
          {message ? <Message tone={message.tone}>{message.text}</Message> : null}
          <CreateStep busy={busy} onCreate={create} />
        </div>
      </PageShell>
    );
  }

  /* ---------- 编辑模式：拉取 authoring state ---------- */
  const viewState: LoadState = state;
  if (viewState.status !== "ready") {
    return (
      <GateShell title={viewState.status === "error" ? t("authoring.unableOpenProblem") : t("authoring.loadingWorkspace")}>
        {viewState.status === "error" ? <p className="text-sm text-soj-danger">{viewState.message}</p> : null}
      </GateShell>
    );
  }

  const data = viewState.data;
  const currentStep = resolveAuthoringStep(data.flow, initialStep);

  return (
    <PageShell>
      <div className="grid gap-6">
        <PageHeader
          eyebrow={t("authoring.console")}
          title={data.problem.title}
          description={`${data.problem.slug} / P${data.problem.id}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={data.problem.publicationStatus === "published" ? "success" : "warning"}>{t(publicationStatusMessageKey(data.problem.publicationStatus))}</StatusPill>
              {data.problem.publicationStatus === "published" ? <LocalizedLink className="text-sm text-soj-accent" href={`/problems/${data.problem.id}`}>{t("authoring.openProblem")}</LocalizedLink> : null}
              <LocalizedLink className="text-sm text-soj-accent" href="/manage/problems">{t("authoring.ownedProblems")}</LocalizedLink>
            </div>
          }
        />

        <AuthoringStepper flow={data.flow} current={currentStep} onSelect={selectStep} />

        {message ? <Message tone={message.tone}>{message.text}</Message> : null}

        {currentStep === "statement" ? (
          <StatementStep statement={data.statement} busy={busy} onSave={(input: ProblemStatementInput) => command(() => client.saveStatement(data.problem.id, input), "authoring.statementVersionSaved")} />
        ) : null}
        {currentStep === "testcase" ? <TestcaseStep testcaseSet={data.testcaseSet} findings={findings} warnings={warnings} busy={busy} onUpload={upload} /> : null}
        {currentStep === "check" ? <CheckStep state={data} busy={busy} onRun={() => command(() => client.runCheck(data.problem.id), "authoring.validationCompleted")} /> : null}
        {currentStep === "review" ? <ReviewStep state={data} busy={busy} onSubmit={() => command(() => client.submitReview(data.problem.id), "authoring.reviewSubmitted")} /> : null}

        <AuthoringDetails problem={data.problem} statement={data.statement} testcaseSet={data.testcaseSet} />
      </div>
    </PageShell>
  );
}

function GateShell({ title, children }: { title: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <PageShell>
      <div className="grid gap-6">
        <PageHeader eyebrow={t("authoring.console")} title={title} />
        {children}
      </div>
    </PageShell>
  );
}

function Message({ tone, children }: { tone: "success" | "danger"; children: React.ReactNode }) {
  return <p className={tone === "success" ? "text-sm text-soj-success" : "text-sm text-soj-danger"} role="status">{children}</p>;
}
