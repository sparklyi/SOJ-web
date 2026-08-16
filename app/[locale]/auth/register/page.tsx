import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import { AccountSurface } from "@/features/auth/account-surface";
import { AuthForm } from "@/features/auth/auth-form";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const t = await getServerTranslator();

  return (
    <AccountSurface
      eyebrow={t("auth.register.eyebrow")}
      title={t("auth.register.title")}
      description={t("auth.register.description")}
      meta={t("auth.register.meta")}
      signal={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.register.accountState")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{t("auth.register.ready")}</p>
            </div>
            <StatusPill tone="success">{t("auth.register.open")}</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>{t("auth.register.profile")}</span>
              <strong>{t("auth.register.handle")}</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("auth.register.scope")}</span>
              <strong>SOJ</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <AuthForm mode="register" />
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="success">{t("auth.register.ready")}</StatusPill>
          <h2 className="text-xl font-semibold">{t("auth.register.permissionAware")}</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">{t("auth.register.registrationDescription")}</p>
          <LocalizedLink className="inline-flex min-h-10 w-fit items-center rounded-soj-md border border-soj-line/60 bg-soj-bg/28 px-3 text-sm font-medium text-soj-accent transition hover:border-soj-accent/55 hover:text-soj-text focus-visible:outline-soj-accent" href="/auth/login">
            {t("auth.register.backToLogin")}
          </LocalizedLink>
        </section>
      </div>
    </AccountSurface>
  );
}
