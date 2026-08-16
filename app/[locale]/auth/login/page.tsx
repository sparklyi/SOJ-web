import { LocalizedLink } from "@/components/i18n/localized-link";
import { StatusPill } from "@/components/soj/status-pill";
import { AccountSurface } from "@/features/auth/account-surface";
import { AuthForm } from "@/features/auth/auth-form";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function LoginPage() {
  const t = await getServerTranslator();

  return (
    <AccountSurface
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      description={t("auth.login.description")}
      meta={t("auth.login.meta")}
      signal={
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-soj-muted">{t("auth.login.sessionRoute")}</p>
              <p className="mt-2 text-2xl font-semibold text-soj-text">{t("auth.login.contestReady")}</p>
            </div>
            <StatusPill tone="accent">{t("auth.login.authLabel")}</StatusPill>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="soj-submission-chip">
              <span>{t("auth.login.authLabel")}</span>
              <strong>SOJ</strong>
            </div>
            <div className="soj-submission-chip">
              <span>{t("auth.login.access")}</span>
              <strong>{t("auth.login.web")}</strong>
            </div>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <AuthForm mode="login" />
        <section className="soj-account-panel grid grid-cols-[minmax(0,1fr)] content-start gap-4 p-5">
          <StatusPill tone="accent">{t("auth.login.session")}</StatusPill>
          <h2 className="text-xl font-semibold">{t("auth.login.sessionState")}</h2>
          <p className="max-w-xl text-sm leading-6 text-soj-muted">{t("auth.login.sessionStateDescription")}</p>
          <LocalizedLink className="inline-flex min-h-10 w-fit items-center rounded-soj-md border border-soj-line/60 bg-soj-bg/28 px-3 text-sm font-medium text-soj-accent transition hover:border-soj-accent/55 hover:text-soj-text focus-visible:outline-soj-accent" href="/auth/register">
            {t("auth.login.createAccount")}
          </LocalizedLink>
        </section>
      </div>
    </AccountSurface>
  );
}
