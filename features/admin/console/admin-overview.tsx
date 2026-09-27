"use client";

import { LocalizedLink } from "@/components/i18n/localized-link";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { adminModulePermissions, visibleAdminModules } from "../modules";

/**
 * /admin 落地页：只做导航，不放实时聚合数字。
 * 每个卡片对应一个后台页面，卡片与标签栏共用同一份模块注册表。
 */
export function AdminOverview() {
  const { can } = useAuth();
  const { t } = useI18n();
  const modules = visibleAdminModules((permission) => can(permission));

  return (
    <PermissionGate anyOf={adminModulePermissions()}>
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
  );
}
