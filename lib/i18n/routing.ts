import { isLocale, type Locale } from "./config";

export function localeFromPath(pathname: string): Locale | null {
  const firstSegment = pathname.split("/")[1];
  return isLocale(firstSegment) ? firstSegment : null;
}

export function unlocalizePath(pathname: string): string {
  const locale = localeFromPath(pathname);
  if (!locale) return pathname || "/";

  const remainder = pathname.slice(`/${locale}`.length);
  return remainder || "/";
}

export function localizePath(locale: Locale, href: string): string {
  if (!href || href.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return href;

  const match = href.match(/^([^?#]*)([\s\S]*)$/);
  const pathname = match?.[1] || "/";
  const suffix = match?.[2] || "";
  if (!pathname.startsWith("/")) return href;

  const currentLocale = localeFromPath(pathname);
  if (pathname === "/" || pathname === `/${currentLocale}`) return `/${locale}${suffix}`;
  if (currentLocale) return `/${locale}${pathname.slice(`/${currentLocale}`.length)}${suffix}`;
  return `/${locale}${pathname}${suffix}`;
}
