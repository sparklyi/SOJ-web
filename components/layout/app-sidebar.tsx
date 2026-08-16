import { LocalizedLink } from "@/components/i18n/localized-link";
import { getServerTranslator } from "@/lib/i18n/server";

const sidebarLinks = [
  { href: "/problems", labelKey: "sidebar.problemSet" },
  { href: "/contests", labelKey: "nav.contests" },
  { href: "/submissions", labelKey: "nav.submissions" },
  { href: "/style-guide", labelKey: "sidebar.styleGuide" },
] as const;

export async function AppSidebar() {
  const t = await getServerTranslator();

  return (
    <aside aria-label={t("sidebar.workspace")} className="hidden border-r border-soj-line bg-soj-bg-raised/45 px-4 py-5 md:block">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-soj-text">{t("sidebar.workspace")}</h2>
          </div>
          <nav aria-label={t("sidebar.sections")}>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
              {sidebarLinks.map((item) => (
                <li key={item.href}>
                  <LocalizedLink href={item.href} className="rounded-soj-md px-3 py-2 text-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text">
                    <span>{t(item.labelKey)}</span>
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </nav>
        </section>
        <section className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-soj-line pt-4">
          <h2 className="text-sm font-semibold text-soj-text">{t("sidebar.judgeSignal")}</h2>
          <p className="text-sm leading-6 text-soj-muted">{t("sidebar.description")}</p>
        </section>
      </div>
    </aside>
  );
}
