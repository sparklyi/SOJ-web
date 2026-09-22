"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { IconButton } from "@/components/ui/icon-button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { localeCookieName, localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routing";

/**
 * 语言切换。
 *
 * 触发器是**一枚图标按钮**（`Languages` 图标，36×36，与右上角账户钮同一个盒子）。
 * 它曾经直接把当前语言的名字摊在页头上（「简体中文」四个字），后果有两个：
 *   ① 在一排中文里它读起来像**又一个导航目的地**，而不是一个控件——
 *      没有图标、没有箭头、没有盒子，没有任何「这里能点」的暗示；
 *   ② 它比旁边的「登录」还亮还宽（触发器继承 `text-soj-text`，比 muted 的登录链接更白），
 *      等于让一个辅助开关压在访客真正要做的动作上面。
 *     （顺带一提，原代码给 `SelectValue` 写的 `text-soj-muted` 根本没生效：
 *      Radix 的 `Value` 会把 `className` 解构掉、不往下传，那行类名是死代码。）
 * 现在的层级是：图标钮 < 「登录」纯文字 < 「注册」实心银。辅助的归辅助。
 *
 * 面板里**当前语言打勾**。触发器不再报当前语言，这个信息就必须由面板承担，
 * 只靠 `data-[state=checked]` 的 accent 颜色不够——颜色是「类」的编码，
 * 而且蓝字在深色面板上更像「链接」而不是「已选中」。
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
      {/* `asChild` + `IconButton`：盒子的定义只有一处（icon-button.tsx），
          这里传的类名只用来抵消 SelectTrigger 自带的「表单控件」外观
          （h-10 / bg-raised / px-3 / justify-between）——twMerge 会把它们删掉。 */}
      <SelectTrigger
        asChild
        className="h-9 w-9 shrink-0 justify-center gap-0 rounded-soj-md border-soj-line bg-soj-surface px-0 text-soj-muted"
      >
        <IconButton label={t("language.switcher")}>
          <Languages aria-hidden className="h-4 w-4" />
        </IconButton>
      </SelectTrigger>
      {/* 高亮项的圆角与面板内边距已经由 `select.tsx` 统一提供（见那里的注释），
          这里不再重复传。 */}
      <SelectContent align="end">
        {locales.map((item) => (
          <SelectItem key={item} value={item}>
            <span className="flex items-center justify-between gap-6">
              <span>{localeLabels[item]}</span>
              {item === locale ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
