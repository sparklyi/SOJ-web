"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { AuthGate } from "@/components/soj/auth-gate";
import { ProblemStatus } from "@/components/soj/problem-status";
import { StatusPill } from "@/components/soj/status-pill";
import { TypeExit } from "@/components/soj/type-exit";
import { AccountSurface } from "@/features/auth/account-surface";

export function AccountOverview() {
  const { status, user } = useAuth();
  const { t } = useI18n();
  const loading = status === "loading";
  const title = loading ? t("auth.me.loading") : (user?.displayName ?? t("auth.me.guest"));

  return (
    <AccountSurface
      eyebrow={t("auth.me.eyebrow")}
      title={t("auth.me.title")}
      description={t("auth.me.description")}
      meta={user ? "@" + user.handle : t("auth.me.guest")}
      aside={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.me.currentUser")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{title}</p>
            </div>
            <StatusPill tone={user ? "accent" : "warning"}>{user ? t("auth.me.signedIn") : loading ? t("auth.me.loading") : t("auth.me.locked")}</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>{t("auth.me.role")}</span>
              <strong>{user?.roles.join(", ") ?? t("auth.me.guestRole")}</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("auth.me.mode")}</span>
              <strong>{t("auth.me.browser")}</strong>
            </div>
          </div>
        </>
      }
    >
      {/* 未登录时曾经只留一句「请先登录」——一句话把人钉在原地，
          既说清了状态又不给出口。状态句后面必须跟一个能走的地方。 */}
      <AuthGate
        user={user}
        fallback={
          <div className="grid justify-items-start gap-4 rounded-soj-lg border border-soj-line bg-soj-surface/45 p-6">
            <p className="text-sm text-soj-muted">{loading ? t("auth.me.loadingAccountSession") : t("auth.me.loginRequired")}</p>
            {loading ? null : <TypeExit href="/auth/login">{t("auth.me.signIn")}</TypeExit>}
          </div>
        }
      >
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5">
            <StatusPill tone="accent">{t("auth.me.signedIn")}</StatusPill>
            <div>
              <h2 className="text-2xl font-semibold">{user?.displayName}</h2>
              <p className="font-mono text-sm text-soj-muted">@{user?.handle}</p>
            </div>
            <p className="text-sm leading-6 text-soj-muted">{t("auth.me.role")}: {user?.roles.join(", ")}</p>
          </section>
          <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-3 p-5">
            <h2 className="text-xl font-semibold">{t("auth.me.progress")}</h2>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-soj-line pb-3 text-sm">
              <span className="text-soj-muted">{t("auth.me.shortestPath")}</span>
              <ProblemStatus status="accepted" label={t("status.solved")} />
            </div>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <span className="text-soj-muted">{t("auth.me.cacheRelay")}</span>
              <ProblemStatus status="attempted" label={t("status.attempted")} />
            </div>
          </section>
        </div>
      </AuthGate>
    </AccountSurface>
  );
}
