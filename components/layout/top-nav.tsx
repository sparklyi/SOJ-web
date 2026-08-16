"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { unlocalizePath } from "@/lib/i18n/routing";
import { cn } from "@/lib/ui/cn";

const navItems = [
  { href: "/", labelKey: "nav.home" },
  { href: "/problems", labelKey: "nav.problems" },
  { href: "/contests", labelKey: "nav.contests" },
  { href: "/submissions", labelKey: "nav.submissions" },
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
  const visibleItems = canOpenAuthoring ? [...navItems, { href: "/manage/problems", labelKey: "nav.author" as const }] : navItems;
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
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
            <span className="h-2.5 w-2.5 rounded-full bg-soj-accent shadow-[0_0_18px_rgb(var(--soj-accent)/0.5)] transition group-hover:scale-125" />
          </span>
          <span className="grid leading-none">
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-soj-text">SOJ</span>
            <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-soj-muted sm:block">{t("nav.signalOnlineJudge")}</span>
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
                      ? "bg-soj-surface text-soj-text shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                      : "text-soj-muted hover:bg-soj-surface/70 hover:text-soj-text",
                  )}
                >
                  {t(item.labelKey)}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden min-w-48 items-center rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/70 px-3 py-2 text-sm text-soj-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition hover:border-soj-accent/40 hover:text-soj-text lg:flex">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-soj-success" />
          {t("nav.searchPublicProblems")}
        </div>
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
                  <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/settings">
                    {t("nav.account.settings")}
                  </LocalizedLink>
                  {canOpenAuthoring ? (
                    <LocalizedLink className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/manage/problems">
                      {t("nav.account.authorProblems")}
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
