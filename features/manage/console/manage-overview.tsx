"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { manageModulePermissions, visibleManageModules } from "../modules";

/**
 * /manage 落地页：与 /admin 同构——只做导航，不放实时聚合数字。
 * 卡片与顶栏入口共用同一份工作台注册表，权限过滤只发生在这个注册表上。
 */
export function ManageOverview() {
  const { can } = useAuth();
  const { t } = useI18n();
  const modules = visibleManageModules((permission) => can(permission));

  return (
    <PageShell title={t("manage.title")} description={t("manage.description")}>
      <PermissionGate anyOf={manageModulePermissions()}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <LocalizedLink
              key={module.key}
              href={module.path}
              className="soj-panel block rounded-soj-lg p-5 transition hover:border-soj-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
            >
              <h2 className="text-sm font-semibold text-soj-text">{t(module.labelKey)}</h2>
              <p className="mt-2 text-sm leading-6 text-soj-muted">{t(module.descriptionKey)}</p>
            </LocalizedLink>
          ))}
        </div>
      </PermissionGate>
    </PageShell>
  );
}
