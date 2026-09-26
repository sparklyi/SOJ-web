"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AuthWall } from "@/components/auth/auth-wall";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { AuthoringProblem } from "@/lib/api/types";
import { publicationStatusMessageKey } from "./publication-status";

type ManagerState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "forbidden" }
  | { status: "error"; message: string }
  | { status: "ready"; problems: AuthoringProblem[] };

/** 出题列表：只负责「我拥有哪些题」与入口，建题流程全部在向导里。 */
export function ProblemManager() {
  const { status: authStatus } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState<ManagerState>({ status: "loading" });
  const viewState: ManagerState = authStatus === "loading" ? { status: "loading" } : authStatus === "anonymous" ? { status: "auth" } : state;

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;

    async function start() {
      try {
        const result = await createBrowserApiClient().problems.listMine();
        if (active) setState({ status: "ready", problems: result.items });
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 403) {
          setState({ status: "forbidden" });
          return;
        }
        setState({ status: "error", message: cause instanceof Error ? cause.message : t("authoring.unableLoadProblems") });
      }
    }
    void start();

    return () => {
      active = false;
    };
  }, [authStatus, t]);

  return (
    <PageShell>
      <div className="grid gap-6">
        <PageHeader
          eyebrow={t("authoring.eyebrow")}
          title={t("authoring.title")}
          actions={
            viewState.status === "auth" || viewState.status === "forbidden" ? null : (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={viewState.status === "ready" ? "accent" : "neutral"}>{managerStatusLabel(t, viewState)}</StatusPill>
                {viewState.status === "ready" ? (
                  <LocalizedLink href="/manage/problems/new" className={buttonVariants({ variant: "secondary", size: "md" })}>
                    <Plus aria-hidden className="h-3.5 w-3.5" />
                    {t("authoring.newProblem")}
                  </LocalizedLink>
                ) : null}
              </div>
            )
          }
        />

        {viewState.status === "auth" ? <AuthWall title={t("gate.signInRequired")} body={t("gate.signInBody")} actionHref="/auth/login" actionLabel={t("gate.signIn")} /> : null}
        {viewState.status === "forbidden" ? <AuthWall title={t("authoring.accessRequired")} body={t("authoring.accessRequiredBody")} /> : null}
        {viewState.status === "error" ? <p className="text-sm text-soj-danger">{viewState.message}</p> : null}
        {viewState.status === "loading" ? <p className="text-sm text-soj-muted">{t("authoring.loadingAuthorWorkspace")}</p> : null}

        {viewState.status === "ready" ? (
          <section className="soj-account-panel overflow-hidden" aria-label={t("authoring.ownedProblems")}>
            <div className="flex items-center justify-between border-b border-soj-line/60 px-5 py-4">
              <h2 className="text-xl font-semibold text-soj-text">{t("authoring.ownedProblems")}</h2>
              <span className="font-mono text-xs text-soj-muted">{viewState.problems.length}</span>
            </div>
            {viewState.problems.length > 0 ? (
              <div className="divide-y divide-soj-line/50">
                {viewState.problems.map((problem) => (
                  <LocalizedLink key={problem.id} href={`/manage/problems/${problem.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-soj-surface/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-soj-text">{problem.title}</span>
                        <StatusPill tone={problem.publicationStatus === "published" ? "success" : "warning"}>{t(publicationStatusMessageKey(problem.publicationStatus))}</StatusPill>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-soj-muted">{problem.slug}</p>
                    </div>
                    <span className="font-mono text-xs text-soj-accent">{t("authoring.edit")}</span>
                  </LocalizedLink>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-soj-muted">{t("authoring.noAuthoredProblems")}</p>
            )}
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

function managerStatusLabel(t: ReturnType<typeof useI18n>["t"], state: ManagerState) {
  if (state.status === "ready") return t("authoring.ownedCount", { count: state.problems.length });
  if (state.status === "loading") return t("authoring.loading");
  if (state.status === "auth") return t("authoring.authRequired");
  if (state.status === "forbidden") return t("authoring.accessRequired");
  return t("authoring.error");
}
