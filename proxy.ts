import { NextResponse, type NextRequest } from "next/server";
import { localeCookieName, localeFromAcceptLanguage, isLocale } from "@/lib/i18n/config";
import { localeFromPath, localizePath } from "@/lib/i18n/routing";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeFromPath(pathname)) return NextResponse.next();

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : localeFromAcceptLanguage(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = localizePath(locale, pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|soj-api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
