"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { localizePath } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator, type Translator } from "@/lib/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  t: Translator;
  localize: (href: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const localize = useCallback((href: string) => localizePath(locale, href), [locale]);
  const value = useMemo(() => ({ locale, t, localize }), [locale, t, localize]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider.");
  return context;
}
