"use client";

import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";
import { AuthWall } from "@/components/auth/auth-wall";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountSurface } from "@/features/auth/account-surface";
import { createBrowserApiClient } from "@/lib/api/client";
import type { ProblemStatus as ProblemStatusValue, ProblemSummary } from "@/lib/api/types";
import { problemStatusLabelKey } from "@/lib/domain/problem";
import { formatNumber } from "@/lib/ui/number";

type ProgressState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; problems: ProblemSummary[] };

/** 引用同一份词条表，顺序即「练得最深 → 最浅」。 */
const progressOrder: ProblemStatusValue[] = ["accepted", "attempted", "todo"];

/**
 * 我的账户。
 *
 * 这里此前有严重的自重复：右上摘要块和主体卡渲染的是同一批字段，
 * 于是「Lin Chen」在一屏出现三次、「@lin-chen」三次、角色列表两次、「已登录」两次；
 * 而进度卡里那两行「最短路 / 缓存中继」是**硬编码的假数据**——
 * 它们既不是这个账号的真实进度，名字也和题库对不上（题库里叫 Shortest Path）。
 *
 * 现在分工是明确的：摘要块只回答「我是谁」（身份 + 角色），
 * 主体只回答「我练到哪了」（从题库真实统计），两边没有一行是重复的。
 */
export function AccountOverview() {
  const { status, user } = useAuth();
  const { t } = useI18n();
  const loading = status === "loading";

  return (
    <AccountSurface
      eyebrow={t("auth.me.eyebrow")}
      title={t("auth.me.title")}
      description={t("auth.me.description")}
      meta={user ? "@" + user.handle : t("auth.me.guest")}
      aside={
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.me.currentUser")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{loading ? t("auth.me.loading") : (user?.displayName ?? t("auth.me.guest"))}</p>
            </div>
            <StatusPill tone={user ? "accent" : "warning"}>{user ? t("auth.me.signedIn") : loading ? t("auth.me.loading") : t("auth.me.locked")}</StatusPill>
          </div>
          <div className="grid gap-1">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.me.role")}</span>
            <span className="text-sm text-soj-text">{user?.roles.join(" · ") ?? t("auth.me.guestRole")}</span>
          </div>
        </div>
      }
    >
      {loading ? (
        <AuthWall title={t("gate.loading")} />
      ) : user ? (
        <ProgressSection />
      ) : (
        <AuthWall title={t("gate.signInRequired")} body={t("gate.signInBody")} actionHref="/auth/login" actionLabel={t("gate.signIn")} />
      )}
    </AccountSurface>
  );
}

/**
 * 练习进度。数据来自题库本身，与题目列表页的「我的进度」是同一个来源，
 * 所以两边永远对得上，题目名也永远只有一套。
 */
function ProgressSection() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<ProgressState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await createBrowserApiClient().problems.list();
        if (active) setState({ status: "ready", problems: result.items });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void start();

    return () => {
      active = false;
    };
  }, []);

  const counts = progressOrder.map((value) => ({
    value,
    count: state.status === "ready" ? state.problems.filter((problem) => problem.status === value).length : 0,
  }));
  const inProgress = state.status === "ready" ? state.problems.filter((problem) => problem.status !== "todo").slice(0, 6) : [];

  return (
    <section className="soj-account-panel grid gap-5 p-5" aria-label={t("auth.me.progress")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-soj-text">{t("auth.me.progress")}</h2>
        <LocalizedLink href="/problems" className="font-mono text-xs text-soj-accent underline-offset-4 transition hover:underline">
          {t("auth.me.openProblemSet")}
        </LocalizedLink>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {counts.map((item) => (
          <div key={item.value} className="rounded-soj-md border border-soj-line/60 bg-soj-bg/25 px-4 py-3">
            <dt className="text-xs text-soj-muted">{t(problemStatusLabelKey[item.value])}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums text-soj-text">{formatNumber(item.count, { locale })}</dd>
          </div>
        ))}
      </dl>

      {state.status === "error" ? <p className="text-sm text-soj-muted">{t("auth.me.progressFailed")}</p> : null}

      {state.status === "ready" && inProgress.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("auth.me.progressEmptyTitle")} description={t("auth.me.progressEmptyDescription")} compact />
      ) : null}

      {inProgress.length > 0 ? (
        <ul className="grid gap-0">
          {inProgress.map((problem, index) => (
            <li
              key={problem.id}
              className={
                index === 0
                  ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
                  : "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-soj-line/50 py-3 text-sm"
              }
            >
              <LocalizedLink href={`/problems/${problem.id}`} className="flex min-w-0 items-baseline gap-2.5 text-soj-text transition-colors hover:text-soj-accent">
                <span className="font-mono text-xs tabular-nums text-soj-muted">#{problem.id}</span>
                <span className="truncate font-medium">{problem.title}</span>
              </LocalizedLink>
              <ProblemStatus status={problem.status} label={t(problemStatusLabelKey[problem.status])} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
