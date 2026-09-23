"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { SundialMark } from "@/components/soj/sundial-mark";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { unlocalizePath } from "@/lib/i18n/routing";
import { cn } from "@/lib/ui/cn";

/**
 * 主导航只放「场所」，而且只放真的存在的场所。
 *
 * 首页 / 题库 / 练习场 / 比赛 —— 这四个是站内的目的地，任何访客都可能去。
 * 练习场放在题库之后、比赛之前：它的门槛与题库同档（入口公开），
 * 但比比赛轻——比赛是有日程的"事件"，练习场是随时可去的"场所"。
 * 「提交记录」不在这里：它是**我的**东西（我的提交、我的设置），
 * 不是站内的一个场所；未登录的人点进去只会看到一个空页面。
 * 所以它和设置、退出一起收进右上角的账号菜单。
 *
 * 关于「排行榜」：OJ 的顶级导航通常有它，但这个站**没有全局积分模型**——
 * 唯一的榜单是单场比赛的排行榜，入口在每场比赛里。
 * 排行榜要成立就得有一套全站用户积分/rating，那是新功能而不是导航整理；
 * 拿三五条编出来的数据撑一个「全局排行榜」，只会多出一个一眼假出来的页面。
 * 所以这里不放。等真的有了全站积分，再加这一项才有意义。
 */
const navItems = [
  { href: "/", labelKey: "nav.home" },
  { href: "/problems", labelKey: "nav.problems" },
  { href: "/playground", labelKey: "nav.playground" },
  { href: "/contests", labelKey: "nav.contests" },
] as const;

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const { status, user, can, logout } = useAuth();
  const { localize, t } = useI18n();
  const authenticatedUser = status === "authenticated" ? user : null;
  const isAuthenticated = authenticatedUser !== null;
  const canOpenAuthoring = can("problem.create") || can("problem.review") || can("problem.manage_all");
  const canOpenReview = can("problem.review") || can("problem.manage_all");
  // Only the globally held capabilities appear here. A contest-scoped judge or
  // manager reaches rejudge from the contest page instead, because the session
  // cannot enumerate contest assignments.
  const canOpenRejudge = can("submission.rejudge") || can("problem.manage_all");
  const canOpenAdmin = can("user.manage");
  const visibleItems = [
    ...navItems,
    ...(canOpenAuthoring ? [{ href: "/manage/problems", labelKey: "nav.author" as const }] : []),
    ...(canOpenReview ? [{ href: "/manage/reviews", labelKey: "nav.reviews" as const }] : []),
    ...(canOpenRejudge ? [{ href: "/manage/rejudge", labelKey: "nav.rejudge" as const }] : []),
    ...(canOpenAdmin ? [{ href: "/admin/users", labelKey: "nav.adminUsers" as const }] : []),
  ];
  const currentPathname = unlocalizePath(pathname);
  const activeHref = visibleItems.find((item) => currentPathname === item.href || (item.href !== "/" && currentPathname.startsWith(`${item.href}/`)))?.href ?? "/";

  useEffect(() => {
    const activeLink = navRef.current?.querySelector<HTMLAnchorElement>(`a[data-href="${activeHref}"]`);
    if (typeof activeLink?.scrollIntoView === "function") {
      activeLink.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [activeHref]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push(localize("/"));
    }
  }

  const accountLabel = isAuthenticated
    ? t("nav.account.openAuthenticated", { name: authenticatedUser.displayName })
    : "";
  const accountInitials = isAuthenticated
    ? initialsFor(authenticatedUser.displayName || authenticatedUser.handle)
    : "";

  return (
    <header className="sticky top-0 z-40 border-b border-soj-line/70 bg-soj-bg/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <LocalizedLink
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-soj-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          {/* 标记是日晷晷面（几何与取舍见 components/soj/sundial-mark.tsx）。
              它替代的是原来「三根递增的柱子」——那组柱子画的是榜单与爬升，
              是 SOJ 时代的语义，跟站名已经没有关系了。
              方框从 28 放到 30：字形取 22px 才读得出（见 sundial-mark.tsx 的笔宽说明），
              而 22px 的字形塞进 28px 方框只剩 2px 余量，环会贴上边框。
              30 是「环与边框之间还留着 3px」的最小值，不是随手挑的。 */}
          <span className="soj-inset-light grid h-[30px] w-[30px] shrink-0 place-items-center rounded-soj-sm border border-soj-line bg-soj-surface transition-colors group-hover:border-soj-line-strong">
            <SundialMark />
          </span>
          <span className="grid leading-none">
            <span className="font-display text-[15px] font-semibold tracking-[0.06em] text-soj-text">Sundial</span>
            <span className="mt-1.5 hidden font-mono text-xs uppercase tracking-[0.14em] text-soj-muted sm:block">{t("nav.brandTagline")}</span>
          </span>
        </LocalizedLink>
        <nav ref={navRef} aria-label={t("nav.primary")} className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max items-center gap-1">
            {visibleItems.map((item) => (
              <li key={item.href}>
                <LocalizedLink
                  href={item.href}
                  data-href={item.href}
                  className={cn(
                    "relative block rounded-soj-md px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
                    item.href === activeHref
                      ? "soj-inset-light bg-soj-surface text-soj-text"
                      : "text-soj-muted hover:bg-soj-surface/70 hover:text-soj-text",
                  )}
                >
                  {t(item.labelKey)}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSwitcher />
        {isAuthenticated ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-soj-md border border-soj-line bg-soj-surface text-sm font-semibold text-soj-text transition hover:border-soj-accent/60 hover:bg-soj-surface-2 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
                aria-label={accountLabel}
              >
                {accountInitials}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="border-b border-soj-line/70 px-3 py-2">
                <p className="text-sm font-medium text-soj-text">{authenticatedUser.displayName}</p>
                <p className="font-mono text-xs text-soj-muted">{authenticatedUser.handle}</p>
              </div>
              <div className="grid gap-1 py-2">
                <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/me">
                  {t("nav.account.me")}
                </LocalizedLink>
                <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/submissions">
                  {t("nav.account.submissions")}
                </LocalizedLink>
                <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/settings">
                  {t("nav.account.settings")}
                </LocalizedLink>
                {/* 管理入口不再在这里重复一遍：出题 / 审核 / 重测 / 用户管理
                    已经在主导航里，而且那边的命名与这里还不一致（「出题」对「管理题目」）。
                    账号菜单只放「我的东西」——我的账户、我的提交、设置、退出。 */}
                <button
                  type="button"
                  className="rounded-soj-sm px-3 py-2 text-left text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
                  onClick={() => void handleLogout()}
                >
                  {t("nav.account.logout")}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <LocalizedLink href="/auth/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("nav.account.login")}
            </LocalizedLink>
            <LocalizedLink href="/auth/register" className={buttonVariants({ variant: "solid", size: "sm" })}>
              {t("nav.account.register")}
            </LocalizedLink>
          </div>
        )}
      </div>
    </header>
  );
}

function initialsFor(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "?";
}
