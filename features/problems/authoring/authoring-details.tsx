"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import type { AuthoringProblem, AuthoringStatement, AuthoringTestcaseSet } from "@/lib/api/types";

type AuthoringDetailsProps = {
  problem: AuthoringProblem;
  statement?: AuthoringStatement;
  testcaseSet?: AuthoringTestcaseSet;
};

/** 折叠收容低频元数据：主界面只留「现在该做什么」，细节需要时才展开。 */
export function AuthoringDetails({ problem, statement, testcaseSet }: AuthoringDetailsProps) {
  const { t } = useI18n();

  return (
    <details className="soj-account-panel overflow-hidden">
      <summary className="cursor-pointer px-5 py-3.5 font-mono text-xs uppercase text-soj-muted">{t("authoring.details.title")}</summary>
      <dl className="grid gap-x-6 gap-y-3 border-t border-soj-line/60 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label={t("authoring.slug")} value={problem.slug} />
        <Detail label={t("authoring.details.problemId")} value={`P${problem.id}`} />
        <Detail label={t("authoring.details.owner")} value={`#${problem.ownerUserId}`} />
        <Detail label={t("authoring.details.statementVersion")} value={statement ? `v${statement.version}` : "—"} />
        <Detail label={t("authoring.details.testcaseVersion")} value={testcaseSet ? `v${testcaseSet.version}` : "—"} />
        <Detail label={t("authoring.details.bytes")} value={testcaseSet ? String(testcaseSet.sizeBytes) : "—"} />
        <Detail label={t("authoring.details.checksum")} value={testcaseSet?.checksumSha256 ?? "—"} />
        <Detail label={t("authoring.details.created")} value={testcaseSet?.createdAt ?? problem.createdAt} />
        <Detail label={t("authoring.details.updated")} value={problem.updatedAt} />
      </dl>
    </details>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-soj-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-sm text-soj-text">{value}</dd>
    </div>
  );
}
