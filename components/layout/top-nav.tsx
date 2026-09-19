"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { unlocalizePath } from "@/lib/i18n/routing";
import { cn } from "@/lib/ui/cn";

/**
 * 主导航只放「场所」，而且只放真的存在的场所。
 *
 * 首页 / 题库 / 比赛 —— 这三个是站内的目的地，任何访客都可能去。
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
    : t("nav.account.openGuest");
  const accountInitials = isAuthenticated ? initialsFor(authenticatedUser.displayName || authenticatedUser.handle) : "G";

  return (
    <header className="sticky top-0 z-40 border-b border-soj-line/70 bg-soj-bg/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <LocalizedLink
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-soj-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          {/* 标记用「三根递增的柱子」：它画的就是这个站要做的事（榜单与爬升），
              比一个放在方框里的发光圆点更具体——后者是任何 SaaS 模板都能套的图形。 */}
          <span className="soj-inset-light grid h-7 w-7 shrink-0 place-items-center rounded-soj-sm border border-soj-line bg-soj-surface transition-colors group-hover:border-soj-line-strong">
            <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 16 16">
              <rect className="fill-soj-muted/45" height="6" rx="1" width="3" x="1" y="9" />
              <rect className="fill-soj-muted/80" height="10" rx="1" width="3" x="6.5" y="5" />
              <rect className="fill-soj-accent" height="14" rx="1" width="3" x="12" y="1" />
            </svg>
          </span>
          <span className="grid leading-none">
            <span className="font-display text-[15px] font-semibold tracking-[0.06em] text-soj-text">SOJ</span>
            <span className="mt-1.5 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-soj-muted sm:block">{t("nav.brandTagline")}</span>
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
        <NavSearch />
        <LanguageSwitcher />
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
            {isAuthenticated ? (
              <div className="border-b border-soj-line/70 px-3 py-2">
                <p className="text-sm font-medium text-soj-text">{authenticatedUser.displayName}</p>
                <p className="font-mono text-xs text-soj-muted">{authenticatedUser.handle}</p>
              </div>
            ) : (
              <div className="border-b border-soj-line/70 px-3 py-2">
                <p className="text-sm font-medium text-soj-text">{t("nav.account.guest")}</p>
                <p className="font-mono text-xs text-soj-muted">{t("nav.account.notSignedIn")}</p>
              </div>
            )}
            <div className="grid gap-1 py-2">
              {isAuthenticated ? (
                <>
                  <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/me">
                    {t("nav.account.me")}
                  </LocalizedLink>
                  <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/submissions">
                    {t("nav.account.submissions")}
                  </LocalizedLink>
                  <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/settings">
                    {t("nav.account.settings")}
                  </LocalizedLink>
                  {canOpenAuthoring ? (
                    <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/manage/problems">
                      {t("nav.account.authorProblems")}
                    </LocalizedLink>
                  ) : null}
                  {canOpenReview ? (
                    <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/manage/reviews">
                      {t("nav.reviews")}
                    </LocalizedLink>
                  ) : null}
                  {canOpenRejudge ? (
                    <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/manage/rejudge">
                      {t("nav.rejudge")}
                    </LocalizedLink>
                  ) : null}
                  {canOpenAdmin ? (
                    <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/admin/users">
                      {t("nav.adminUsers")}
                    </LocalizedLink>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-soj-sm px-3 py-2 text-left text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
                    onClick={() => void handleLogout()}
                  >
                    {t("nav.account.logout")}
                  </button>
                </>
              ) : (
                <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/auth/login">
                  {t("nav.account.login")}
                </LocalizedLink>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

/**
 * 导航搜索。
 *
 * 旧版这里是一个**假搜索框**：一个看起来像输入框的 div，里面写着
 * 「搜索公开题目」，点它没有任何反应。这比没有搜索更糟——它承诺了一件事然后做不到，
 * 是「演示稿」最典型的痕迹。
 *
 * 现在它是真的：回车即跳到题库页并带上查询词复用题库页已有的筛选参数，
 * 因此搜索结果与在题库页手输完全一致，不存在第二套搜索逻辑。
 */
function NavSearch() {
  const router = useRouter();
  const { localize, t } = useI18n();
  const [value, setValue] = useState("");

  return (
    <form
      className="soj-inset-light hidden min-w-48 items-center gap-2 rounded-soj-md border border-soj-line bg-soj-bg-raised/70 px-3 py-2 text-sm transition-colors focus-within:border-soj-accent/70 lg:flex"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(localize(query ? `/problems?q=${encodeURIComponent(query)}` : "/problems"));
      }}
      role="search"
    >
      <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-soj-muted" />
      <input
        aria-label={t("nav.searchPublicProblems")}
        className="w-full min-w-0 bg-transparent text-sm text-soj-text outline-none placeholder:text-soj-muted/75"
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("nav.searchPublicProblems")}
        type="search"
        value={value}
      />
    </form>
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

  return initials || "G";
}
