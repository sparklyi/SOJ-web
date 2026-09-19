"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { useContestJudgeAccess, useContestRoleAccess } from "@/lib/auth/contest-access";

const entryClass =
  "inline-flex min-h-10 items-center justify-center rounded-soj-md border border-soj-line/55 bg-soj-bg/28 px-3 py-2 text-sm font-medium text-soj-muted transition hover:border-soj-accent/45 hover:text-soj-text active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent";

/**
 * Contest-scoped administration entries.
 *
 * Both destinations are authorized from per-contest roles that never appear in
 * the global permission set (the global role endpoint rejects them with
 * `role.invalid_role`), so each link resolves its own access from the contest
 * payload and renders nothing until it is granted. The detail page therefore
 * needs no server-side auth state — the session lives in browser storage only.
 *
 * Each hook performs its own contest lookup because it mirrors a distinct
 * backend predicate (`requireContestManager` vs. `requireContestJudge`); for a
 * signed-in non-admin viewer that is two reads of the same contest.
 */
export function ContestManageEntries({ contestId }: { contestId: number }) {
  const { t } = useI18n();
  const roleAccess = useContestRoleAccess(contestId);
  const judgeAccess = useContestJudgeAccess(contestId);

  return (
    <>
      {roleAccess.state === "granted" ? (
        <LocalizedLink href={`/contests/${contestId}/roles`} className={entryClass}>
          {t("nav.contestRoles")}
        </LocalizedLink>
      ) : null}
      {judgeAccess.state === "granted" ? (
        <LocalizedLink href={`/contests/${contestId}/rejudge`} className={entryClass}>
          {t("nav.contestRejudge")}
        </LocalizedLink>
      ) : null}
    </>
  );
}
