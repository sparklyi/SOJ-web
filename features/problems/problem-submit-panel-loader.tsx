"use client";

import { useEffect, useState } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { listEnabledLanguages } from "@/features/languages/api";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProblemSubmitPanel } from "./problem-submit-panel";

type ProblemSubmitPanelLoaderProps = {
  problem: ProblemDetail;
  initialLanguages?: JudgeLanguage[];
};

type LanguageState =
  | { status: "ready"; languages: JudgeLanguage[] }
  | { status: "loading"; languages: JudgeLanguage[] }
  | { status: "error"; languages: JudgeLanguage[]; message: string };

export function ProblemSubmitPanelLoader({ problem, initialLanguages = [] }: ProblemSubmitPanelLoaderProps) {
  const { t } = useI18n();
  const [state, setState] = useState<LanguageState>(() => ({
    status: initialLanguages.length > 0 ? "ready" : "loading",
    languages: initialLanguages,
  }));

  useEffect(() => {
    if (initialLanguages.length > 0) return;

    listEnabledLanguages(createBrowserApiClient())
      .then((result) => setState({ status: "ready", languages: result.items }))
      .catch((error: unknown) => {
        const fallback =
          getApiMode() === "http"
            ? t("problems.languageCatalogUnavailableHttp")
            : t("problems.languageCatalogUnavailable");
        setState({
          status: "error",
          languages: [],
          message: error instanceof Error ? error.message : fallback,
        });
      });
  }, [initialLanguages.length, t]);

  return (
    <div className="grid gap-3">
      {state.status === "loading" ? <p className="rounded-soj-md border border-soj-line/55 bg-soj-bg-raised/60 px-3 py-2 text-sm text-soj-muted">{t("problems.loadingLanguageCatalog")}</p> : null}
      {state.status === "error" ? (
        <p className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/10 px-3 py-2 text-sm text-soj-muted">{state.message}</p>
      ) : null}
      {state.status === "ready" && state.languages.length === 0 ? (
        <p className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/10 px-3 py-2 text-sm text-soj-muted">
          {t("problems.languageCatalogEmpty")}
        </p>
      ) : null}
      <ProblemSubmitPanel problem={problem} languages={state.languages} />
    </div>
  );
}
