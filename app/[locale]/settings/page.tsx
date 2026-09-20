"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Input } from "@/components/ui/input";
import { AccountSurface } from "@/features/auth/account-surface";

export default function SettingsPage() {
  const { status, user } = useAuth();
  const { t } = useI18n();
  const loading = status === "loading";
  const preferences = [
    { key: "theme", label: t("auth.settings.themePreference") },
    { key: "language", label: t("auth.settings.languagePreference") },
    { key: "feedback", label: t("auth.settings.judgeFeedbackPreference") },
  ];

  return (
    <AccountSurface
      eyebrow={t("auth.settings.eyebrow")}
      title={t("auth.settings.title")}
      description={t("auth.settings.description")}
      meta={user ? "@" + user.handle : t("auth.settings.guest")}
      aside={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.settings.workspace")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{loading ? t("auth.settings.loading") : user ? t("auth.settings.synced") : t("auth.settings.guest")}</p>
            </div>
            <StatusPill tone={user ? "accent" : "warning"}>{user ? t("auth.settings.signedIn") : loading ? t("auth.settings.loading") : t("auth.settings.locked")}</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>{t("auth.settings.theme")}</span>
              <strong>{t("auth.settings.themeName")}</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("auth.settings.editor")}</span>
              <strong>{t("auth.settings.cpp17")}</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5">
          <h2 className="text-xl font-semibold">{t("auth.settings.profile")}</h2>
          <Input
            id="settings-handle"
            label={t("auth.settings.handle")}
            value={user?.handle ?? ""}
            readOnly
            helperText={user ? t("auth.settings.loadedAccount") : t("auth.settings.loginRequired")}
          />
          <Input id="settings-name" label={t("auth.settings.displayName")} value={user?.displayName ?? ""} readOnly />
        </section>
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="accent">{t("auth.settings.local")}</StatusPill>
          <h2 className="text-xl font-semibold">{t("auth.settings.preferences")}</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">{t("auth.settings.preferencesDescription")}</p>
          {/* 三行「偏好」曾经各是一个描边盒 + 一枚亮蓝圆点。圆点的语义是「已选中」，
              而这三项没有任何一项可切换——一个说谎的状态标记。
              清单也不该套盒子：盒子的边界在近黑底上几乎看不见，只留下一圈噪点。 */}
          <ul className="grid gap-1.5 text-sm text-soj-muted">
            {preferences.map((item) => (
              <li key={item.key}>{item.label}</li>
            ))}
          </ul>
        </section>
      </div>
    </AccountSurface>
  );
}
