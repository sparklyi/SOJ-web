"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AuthoringTestcaseSet, TestcaseFinding } from "@/lib/api/types";
import { testcaseFindingMessage } from "../testcase-findings";
import { TestcaseFormatGuide } from "../testcase-format-guide";

type TestcaseStepProps = {
  testcaseSet?: AuthoringTestcaseSet;
  findings?: TestcaseFinding[];
  warnings: TestcaseFinding[];
  busy: boolean;
  onUpload: (file: File) => Promise<void> | void;
};

/** ③ 测试数据：没有用例数输入，数量由后端解析压缩包得出。 */
export function TestcaseStep({ testcaseSet, findings, warnings, busy, onUpload }: TestcaseStepProps) {
  const { t } = useI18n();
  const [archive, setArchive] = useState<File | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (archive) void onUpload(archive);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form className="soj-account-panel grid gap-5 p-5" onSubmit={submit}>
        <div className="border-b border-soj-line/55 pb-4">
          <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.testcase")}</p>
          <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.testcase.heading")}</h2>
        </div>

        <Input id="testcase-archive" accept=".zip,application/zip" label={t("authoring.archive")} required type="file" onChange={(event) => setArchive(event.target.files?.[0] ?? null)} />
        <div>
          <Button type="submit" variant="secondary" loading={busy} disabled={!archive}>
            {t("authoring.uploadArchive")}
          </Button>
        </div>

        {findings && findings.length > 0 ? (
          <ul className="grid gap-2" aria-label={t("authoring.findings.title")}>
            {findings.map((finding, index) => (
              <li key={`${finding.code}-${finding.file ?? index}`} className="flex items-start gap-2 rounded-soj-md border border-soj-danger/35 bg-soj-danger/8 px-3 py-3 text-sm text-soj-danger">
                <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{testcaseFindingMessage(t, finding)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="grid gap-2" aria-label={t("authoring.warnings")}>
            {warnings.map((finding, index) => (
              <li key={`${finding.code}-${finding.file ?? index}`} className="flex items-start gap-2 rounded-soj-md border border-soj-warning/35 bg-soj-warning/8 px-3 py-3 text-sm text-soj-warning">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{testcaseFindingMessage(t, finding)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {testcaseSet ? (
          <section className="grid gap-3 border-t border-soj-line/55 pt-4" aria-label={t("authoring.testcase.current")}>
            <p className="text-sm text-soj-success">{t("authoring.testcase.parsed", { count: testcaseSet.caseCount })}</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DataPoint label={t("authoring.cases")} value={String(testcaseSet.caseCount)} />
              <DataPoint label={t("authoring.size")} value={`${testcaseSet.sizeBytes} B`} />
              <DataPoint label={t("authoring.version")} value={`v${testcaseSet.version}`} />
            </dl>
          </section>
        ) : null}
      </form>

      <TestcaseFormatGuide />
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-soj-md border border-soj-line/50 bg-soj-bg/25 px-3 py-3">
      <dt className="text-xs text-soj-muted">{label}</dt>
      <dd className="mt-1 truncate font-mono text-sm text-soj-text">{value}</dd>
    </div>
  );
}
