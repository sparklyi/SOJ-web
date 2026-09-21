"use client";

import { SlidersHorizontal } from "lucide-react";
import { AuthWall } from "@/components/auth/auth-wall";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountSurface } from "@/features/auth/account-surface";

/**
 * 设置页。
 *
 * 这一页此前有三处「看起来能用、其实不能」：右上摘要块有「主题 深色 / 编辑器 C++17」，
 * 主体「偏好设置」卡里又把同样两项写了一遍；资料区的两个 `readOnly` 输入框
 * 长得和可编辑的输入框一模一样，读者会先试着改一下；偏好卡里那句
 * 「……将在后续设置阶段提供」等于在产品页面上承认功能没做。
 *
 * 现在：摘要块只说工作区状态，资料区用只读的键值行（不是输入框），
 * 偏好区落到一个设计过的空态上——没做的功能不假装有。
 */
export default function SettingsPage() {
  const { status, user } = useAuth();
  const { t } = useI18n();
  const loading = status === "loading";

  return (
    <AccountSurface
      eyebrow={t("auth.settings.eyebrow")}
      title={t("auth.settings.title")}
      description={t("auth.settings.description")}
      meta={user ? "@" + user.handle : t("auth.settings.guest")}
      aside={
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.settings.workspace")}</p>
            <p className="mt-2 text-2xl font-semibold text-soj-text">{loading ? t("auth.settings.loading") : user ? t("auth.settings.synced") : t("auth.settings.guest")}</p>
          </div>
          <StatusPill tone={user ? "accent" : "warning"}>{user ? t("auth.settings.signedIn") : loading ? t("auth.settings.loading") : t("auth.settings.locked")}</StatusPill>
        </div>
      }
    >
      {loading ? (
        <AuthWall title={t("gate.loading")} />
      ) : user ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="soj-account-panel grid gap-4 p-5" aria-label={t("auth.settings.profile")}>
            <h2 className="text-xl font-semibold text-soj-text">{t("auth.settings.profile")}</h2>
            <dl className="grid gap-4">
              <div className="grid gap-1">
                <dt className="text-xs text-soj-muted">{t("auth.settings.handle")}</dt>
                <dd className="font-mono text-sm text-soj-text">{user.handle}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs text-soj-muted">{t("auth.settings.displayName")}</dt>
                <dd className="text-sm text-soj-text">{user.displayName}</dd>
              </div>
            </dl>
            <p className="border-t border-soj-line/60 pt-4 text-xs leading-5 text-soj-muted">{t("auth.settings.readOnly")}</p>
          </section>

          <section className="soj-account-panel grid gap-4 p-5" aria-label={t("auth.settings.preferences")}>
            <h2 className="text-xl font-semibold text-soj-text">{t("auth.settings.preferences")}</h2>
            <EmptyState
              icon={SlidersHorizontal}
              title={t("auth.settings.preferencesEmptyTitle")}
              description={t("auth.settings.preferencesEmptyDescription")}
              compact
            />
          </section>
        </div>
      ) : (
        <AuthWall title={t("gate.signInRequired")} body={t("gate.signInBody")} actionHref="/auth/login" actionLabel={t("gate.signIn")} />
      )}
    </AccountSurface>
  );
}
