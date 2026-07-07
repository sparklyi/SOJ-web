"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/ui/cn";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/contests", label: "Contests" },
  { href: "/submissions", label: "Submissions" },
];

export function TopNav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-soj-line/70 bg-soj-bg/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-soj-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
            <span className="h-2.5 w-2.5 rounded-full bg-soj-accent shadow-[0_0_18px_rgb(var(--soj-accent)/0.5)] transition group-hover:scale-125" />
          </span>
          <span className="grid leading-none">
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-soj-text">SOJ</span>
            <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-soj-muted sm:block">Signal Online Judge</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative block rounded-soj-md px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                      ? "bg-soj-surface text-soj-text shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                      : "text-soj-muted hover:bg-soj-surface/70 hover:text-soj-text",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden min-w-48 items-center rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/70 px-3 py-2 text-sm text-soj-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition hover:border-soj-accent/40 hover:text-soj-text lg:flex">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-soj-success" />
          Search public problems
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-soj-md border border-soj-line bg-soj-surface text-sm font-semibold text-soj-text transition hover:border-soj-accent/60 hover:bg-soj-surface-2 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
              aria-label="Open user menu"
            >
              LC
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="border-b border-soj-line/70 px-3 py-2">
              <p className="text-sm font-medium text-soj-text">Lin Chen</p>
              <p className="font-mono text-xs text-soj-muted">lin-chen</p>
            </div>
            <div className="grid gap-1 py-2">
              <Link className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/me">
                Me
              </Link>
              <Link className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/settings">
                Settings
              </Link>
              <Link className="rounded-soj-sm px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text" href="/auth/login">
                Login
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
