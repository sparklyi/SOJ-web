import Link from "next/link";

const sidebarLinks = [
  { href: "/problems", label: "Problem set" },
  { href: "/contests", label: "Contests" },
  { href: "/submissions", label: "Submissions" },
  { href: "/style-guide", label: "Style guide" },
];

export function AppSidebar() {
  return (
    <aside aria-label="Workspace" className="hidden border-r border-soj-line bg-soj-bg-raised/45 px-4 py-5 md:block">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-soj-text">Workspace</h2>
          </div>
          <nav aria-label="Workspace sections">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
              {sidebarLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-soj-md px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text">
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-soj-line pt-4">
          <h2 className="text-sm font-semibold text-soj-text">Judge Signal</h2>
          <p className="text-sm leading-6 text-soj-muted">Navigation, account state, and contest signals stay aligned with the active workspace.</p>
        </section>
      </div>
    </aside>
  );
}
