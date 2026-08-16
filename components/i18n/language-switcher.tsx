"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { localeCookieName, localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routing";

export function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { locale, t } = useI18n();

  function handleChange(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Max-Age=31536000; Path=/; SameSite=Lax`;
    const query = window.location.search;
    const hash = window.location.hash;
    router.replace(`${localizePath(nextLocale, pathname)}${query}${hash}`, { scroll: false });
  }

  return (
    <label className="inline-flex h-9 items-center rounded-soj-md border border-soj-line bg-soj-surface px-2 text-xs text-soj-muted transition hover:border-soj-accent/60 hover:text-soj-text">
      <span className="sr-only">{t("language.switcher")}</span>
      <select
        aria-label={t("language.switcher")}
        className="bg-transparent font-mono text-xs text-inherit outline-none"
        value={locale}
        onChange={(event) => handleChange(event.target.value as Locale)}
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-soj-bg-raised text-soj-text">
            {localeLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
