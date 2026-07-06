import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/contests", label: "Contests" },
  { href: "/submissions", label: "Submissions" },
  { href: "/me", label: "Me" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-soj-line bg-soj-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 md:px-8">
        <Link href="/" className="shrink-0 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-soj-accent">
          SOJ
        </Link>
        <nav aria-label="Primary" className="min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-soj-md px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text focus-visible:outline-soj-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
