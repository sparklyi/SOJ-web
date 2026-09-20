"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localeCookieName, localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routing";

/**
 * 语言切换。
 *
 * 曾经是原生 `<select>`：原生下拉的面板归操作系统渲染，
 * `option` 上的背景类在绝大多数浏览器里不生效，弹出来是一块系统白底——
 * 深色页面里一块刺眼的白色补丁，这就是「下拉效果不对」的根源。
 * 现在走共享的 `Select`（Radix），面板与筛选栏的下拉是同一份材料。
 */
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
    <Select value={locale} onValueChange={(value) => handleChange(value as Locale)}>
      <SelectTrigger
        aria-label={t("language.switcher")}
        className="h-9 w-auto gap-1.5 rounded-soj-md bg-soj-surface px-2.5 text-xs"
      >
        <SelectValue className="font-mono text-soj-muted" />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((item) => (
          <SelectItem key={item} value={item}>
            {localeLabels[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
