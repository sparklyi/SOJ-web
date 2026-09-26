"use client";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemAuthoringState } from "@/lib/api/types";
import { canSubmitProblemReview, publicationStatusMessageKey } from "../publication-status";

type ReviewStepProps = {
  state: ProblemAuthoringState;
  busy: boolean;
  onSubmit: () => void;
};

/** ⑤ 提审：先给摘要，再按后端 publishable 决定按钮是否可用。 */
export function ReviewStep({ state, busy, onSubmit }: ReviewStepProps) {
  const { t, locale } = useI18n();
  const status = state.problem.publicationStatus;
  const published = status === "published";
  const reviewPending = status === "in_review";
  const canSubmit = canSubmitProblemReview(status, state.publishable);
  const check = state.latestCheck;

  return (
    <section className="soj-account-panel grid content-start gap-5 p-5" aria-label={t("authoring.review.heading")}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-soj-line/55 pb-4">
        <div>
          <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.review")}</p>
          <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.review.heading")}</h2>
        </div>
        <StatusPill tone={published ? "success" : reviewPending ? "accent" : canSubmit ? "accent" : "warning"}>{t(publicationStatusMessageKey(status))}</StatusPill>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2" aria-label={t("authoring.review.summary")}>
        <Summary label={t("authoring.titleLabel")} value={state.problem.title} />
        <Summary label={t("authoring.details.owner")} value={`#${state.problem.ownerUserId}`} />
        <Summary label={t("authoring.step.statement")} value={state.statement ? t("authoring.review.statement", { version: state.statement.version }) : "—"} />
        <Summary
          label={t("authoring.step.testcase")}
          value={state.testcaseSet ? t("authoring.review.testcase", { version: state.testcaseSet.version }) : "—"}
        />
        <Summary
          label={t("authoring.cases")}
          value={state.testcaseSet ? `${state.testcaseSet.caseCount} · ${state.testcaseSet.sizeBytes} B` : "—"}
        />
        <Summary
          label={t("authoring.step.check")}
          value={check ? new Date(check.createdAt).toLocaleString(locale) : t("authoring.review.notChecked")}
        />
      </dl>

      {state.blockers.length > 0 ? (
        <ul className="grid gap-2" aria-label={t("authoring.publishBlockers")}>
          {state.blockers.map((blocker) => (
            <li key={blocker.code} className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/8 px-3 py-3 text-sm text-soj-warning">
              {blocker.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-soj-muted">{t("authoring.validationPassed")}</p>
      )}

      <div>
        <Button
          type="button"
          loading={busy}
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {reviewPending ? t("authoring.reviewInProgress") : published ? t("authoring.published") : t("authoring.submitReview")}
        </Button>
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-soj-md border border-soj-line/50 bg-soj-bg/25 px-3 py-3">
      <dt className="text-xs text-soj-muted">{label}</dt>
      <dd className="mt-1 truncate font-mono text-sm text-soj-text">{value}</dd>
    </div>
  );
}
