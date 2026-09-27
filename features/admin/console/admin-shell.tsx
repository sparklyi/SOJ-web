"use client";

import type { ReactNode } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/ui/cn";
import { visibleAdminModules, type AdminModuleKey } from "../modules";

type AdminShellProps = {
  active: AdminModuleKey | "overview";
  children: ReactNode;
};

/**
 * 后台骨架：统一的页面壳 + 按权限过滤的页内标签。
 *
 * 这里只负责「显形」——真正的拒绝判断在每个页面自己的 PermissionGate 上，
 * 否则直接输 URL 的人会看到一个开放的空壳，而不是 403。
 */
export function AdminShell({ active, children }: AdminShellProps) {
  const { can } = useAuth();
  const { t } = useI18n();
  const modules = visibleAdminModules((permission) => can(permission));
  const tabs = [
    { key: "overview" as const, path: "/admin", labelKey: "admin.tab.overview" as const },
    ...modules.map((module) => ({ key: module.key, path: module.path, labelKey: module.labelKey })),
  ];

  return (
    <PageShell title={t("admin.title")} description={t("admin.description")}>
      <nav aria-label={t("admin.title")} className="mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max items-center gap-1 rounded-soj-md border border-soj-line bg-soj-bg-raised p-1">
          {tabs.map((tab) => (
            <li key={tab.key}>
              <LocalizedLink
                href={tab.path}
                aria-current={tab.key === active ? "page" : undefined}
                className={cn(
                  "block rounded-soj-sm px-3 py-1.5 text-sm transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
                  tab.key === active ? "bg-soj-surface text-soj-text" : "text-soj-muted hover:bg-soj-surface/70 hover:text-soj-text",
                )}
              >
                {t(tab.labelKey)}
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </PageShell>
  );
}
