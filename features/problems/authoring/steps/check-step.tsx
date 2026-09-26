"use client";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemAuthoringState, ProblemCheckFinding, TestcaseFinding } from "@/lib/api/types";
import { testcaseFindingMessage } from "../testcase-findings";

type CheckStepProps = {
  state: ProblemAuthoringState;
  busy: boolean;
  onRun: () => void;
};

/** ④ 校验：说明校验对象（题面版本 + 测试集版本），运行后端 check。 */
export function CheckStep({ state, busy, onRun }: CheckStepProps) {
  const { t } = useI18n();
  const check = state.latestCheck;

  return (
    <section className="soj-account-panel grid content-start gap-5 p-5" aria-label={t("authoring.check.heading")}>
      <div className="border-b border-soj-line/55 pb-4">
        <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.check")}</p>
        <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.check.heading")}</h2>
        {state.statement && state.testcaseSet ? (
          <p className="mt-1 text-sm text-soj-muted">{t("authoring.check.object", { statement: state.statement.version, testcase: state.testcaseSet.version })}</p>
        ) : (
          <p className="mt-1 text-sm text-soj-muted">{t("authoring.check.none")}</p>
        )}
      </div>

      {check ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={check.summary.valid ? "success" : "danger"}>{check.summary.valid ? t("authoring.check.passed") : t("authoring.check.failed")}</StatusPill>
            <span className="font-mono text-xs text-soj-muted">
              {t("authoring.cases")} {check.summary.caseCount} · {t("authoring.errors")} {check.summary.errorCount} · {t("authoring.warnings")} {check.summary.warningCount}
            </span>
          </div>
          {check.findings.length > 0 ? (
            <ul className="grid gap-2" aria-label={t("authoring.findings.title")}>
              {check.findings.map((finding) => (
                <li key={finding.id} className="grid gap-1 rounded-soj-md border border-soj-line/55 bg-soj-bg/25 px-3 py-3">
                  <span className="font-mono text-xs uppercase text-soj-danger">{finding.code}</span>
                  <span className="text-sm text-soj-text">{testcaseFindingMessage(t, toTestcaseFinding(finding))}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-soj-muted">{t("authoring.check.none")}</p>
      )}

      <div>
        <Button type="button" variant="secondary" loading={busy} onClick={onRun} disabled={!state.testcaseSet}>
          {t("authoring.runValidation")}
        </Button>
      </div>
    </section>
  );
}

function toTestcaseFinding(finding: ProblemCheckFinding): TestcaseFinding {
  return {
    severity: finding.severity,
    code: finding.code,
    message: finding.message,
    ...(finding.testcaseKey ? { file: finding.testcaseKey } : {}),
  };
}
