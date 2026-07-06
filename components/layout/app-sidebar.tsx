import Link from "next/link";
import { StatusPill } from "@/components/soj/status-pill";

const sidebarLinks = [
  { href: "/problems", label: "Problem set", value: "8" },
  { href: "/contests", label: "Contests", value: "2" },
  { href: "/submissions", label: "Submissions", value: "8" },
  { href: "/style-guide", label: "Style guide", value: "v2" },
];

export function AppSidebar() {
  return (
    <aside aria-label="Workspace" className="hidden border-r border-soj-line bg-soj-bg-raised/45 px-4 py-5 md:block">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-soj-text">Workspace</h2>
            <StatusPill tone="accent">Mock</StatusPill>
          </div>
          <nav aria-label="Workspace sections">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
              {sidebarLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="grid grid-cols-[1fr_auto] gap-3 rounded-soj-md px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text">
                    <span>{item.label}</span>
                    <span className="font-mono text-xs text-soj-muted">{item.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-soj-line pt-4">
          <h2 className="text-sm font-semibold text-soj-text">Judge Signal</h2>
          <p className="text-sm leading-6 text-soj-muted">Mock mode keeps navigation, account state, and contest signals stable for local review.</p>
        </section>
      </div>
    </aside>
  );
}
