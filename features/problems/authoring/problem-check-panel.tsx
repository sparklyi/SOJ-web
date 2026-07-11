"use client";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import type { ProblemAuthoringState } from "@/lib/api/types";

type ProblemCheckPanelProps = {
  state: ProblemAuthoringState;
  busy: boolean;
  onRunCheck: () => void;
  onPublish: () => void;
};

export function ProblemCheckPanel({ state, busy, onRunCheck, onPublish }: ProblemCheckPanelProps) {
  const check = state.latestCheck;
  const published = state.problem.publicationStatus === "published";

  return (
    <section className="soj-account-panel grid content-start gap-5 p-5" aria-label="Validation and publication">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase text-soj-muted">Release gate</p>
          <h2 className="mt-2 text-xl font-semibold text-soj-text">{state.publishable ? "Ready to publish" : "Publish blocked"}</h2>
        </div>
        <StatusPill tone={published ? "success" : state.publishable ? "accent" : "warning"}>{published ? "Published" : state.publishable ? "Validated" : "Draft"}</StatusPill>
      </div>

      {state.blockers.length > 0 ? (
        <ul className="grid gap-2" aria-label="Publish blockers">
          {state.blockers.map((blocker) => (
            <li key={blocker.code} className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/8 px-3 py-3 text-sm text-soj-warning">
              {blocker.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-soj-muted">The current statement and testcase set passed the backend validation gate.</p>
      )}

      {check ? (
        <div className="grid gap-3 border-t border-soj-line/60 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Cases" value={`${check.summary.caseCount}/${check.summary.expectedCaseCount}`} />
            <Metric label="Errors" value={String(check.summary.errorCount)} />
            <Metric label="Warnings" value={String(check.summary.warningCount)} />
          </div>
          {check.findings.length > 0 ? (
            <ul className="grid gap-2">
              {check.findings.map((finding) => (
                <li key={finding.id} className="grid gap-1 rounded-soj-md border border-soj-line/55 bg-soj-bg/25 px-3 py-3">
                  <span className="font-mono text-[11px] uppercase text-soj-danger">{finding.code}</span>
                  <span className="text-sm text-soj-text">{finding.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" loading={busy} onClick={onRunCheck} disabled={!state.testcaseSet}>
          Run validation
        </Button>
        <Button type="button" loading={busy} onClick={onPublish} disabled={!state.publishable || published}>
          Publish problem
        </Button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soj-md border border-soj-line/50 bg-soj-bg/25 px-3 py-3">
      <p className="text-xs text-soj-muted">{label}</p>
      <p className="mt-1 font-mono text-lg text-soj-text">{value}</p>
    </div>
  );
}
