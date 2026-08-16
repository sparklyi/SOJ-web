"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { AuthGate } from "@/components/soj/auth-gate";
import { StatusPill } from "@/components/soj/status-pill";
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
      signal={
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
              <strong>{user?.role ?? t("auth.me.guestRole")}</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("auth.me.mode")}</span>
              <strong>{t("auth.me.browser")}</strong>
            </div>
          </div>
        </>
      }
    >
      <AuthGate user={user} fallback={<p className="text-sm text-soj-muted">{loading ? t("auth.me.loadingAccountSession") : t("auth.me.loginRequired")}</p>}>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5">
            <StatusPill tone="accent">{t("auth.me.signedIn")}</StatusPill>
            <div>
              <h2 className="text-2xl font-semibold">{user?.displayName}</h2>
              <p className="font-mono text-sm text-soj-muted">@{user?.handle}</p>
            </div>
            <p className="text-sm leading-6 text-soj-muted">{t("auth.me.role")}: {user?.role}</p>
          </section>
          <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-3 p-5">
            <h2 className="text-xl font-semibold">{t("auth.me.progress")}</h2>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-soj-line pb-3 text-sm">
              <span className="text-soj-muted">{t("auth.me.signalPath")}</span>
              <StatusPill tone="success">{t("status.solved")}</StatusPill>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
              <span className="text-soj-muted">{t("auth.me.cacheRelay")}</span>
              <StatusPill tone="warning">{t("status.attempted")}</StatusPill>
            </div>
          </section>
        </div>
      </AuthGate>
    </AccountSurface>
  );
}
