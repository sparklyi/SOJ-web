export const locales = ["en", "zh-CN"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "soj-locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function localeFromAcceptLanguage(value: string | null | undefined): Locale {
  if (!value) return defaultLocale;

  const candidates = value
    .split(",")
    .map((part) => {
      const [language, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const weight = quality ? Number.parseFloat(quality.trim().slice(2)) : 1;
      return { language, weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((candidate) => candidate.language && candidate.weight > 0)
    .sort((left, right) => right.weight - left.weight);

  for (const candidate of candidates) {
    if (candidate.language === "zh" || candidate.language.startsWith("zh-")) return "zh-CN";
    if (candidate.language === "en" || candidate.language.startsWith("en-")) return "en";
  }

  return defaultLocale;
}
