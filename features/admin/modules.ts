import type { Permission } from "@/lib/auth/permissions";
import type { MessageKey } from "@/lib/i18n/messages";

export type AdminModuleKey = "languages" | "problems" | "contests" | "users" | "audit";

export type AdminModule = {
  key: AdminModuleKey;
  path: string;
  permission: Permission;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
};

/**
 * 后台页面注册表：顶栏入口、概览卡片、页内标签都从这一份数据派生。
 *
 * 权限是与页面的唯一对应关系，所以它只写在这里。新增页面时改这一处，
 * 导航显隐、`/admin` 落地页和标签栏会同时跟上；测试会断言每个模块的
 * permission 都存在于权限目录里。
 */
export const adminModules: readonly AdminModule[] = [
  {
    key: "languages",
    path: "/admin/languages",
    permission: "system.manage",
    labelKey: "admin.tab.languages",
    descriptionKey: "admin.overview.languages",
  },
  {
    key: "problems",
    path: "/admin/problems",
    permission: "problem.manage_all",
    labelKey: "admin.tab.problems",
    descriptionKey: "admin.overview.problems",
  },
  {
    key: "contests",
    path: "/admin/contests",
    permission: "contest.manage_all",
    labelKey: "admin.tab.contests",
    descriptionKey: "admin.overview.contests",
  },
  {
    key: "users",
    path: "/admin/users",
    permission: "user.manage",
    labelKey: "admin.tab.users",
    descriptionKey: "admin.overview.users",
  },
  {
    key: "audit",
    path: "/admin/audit",
    permission: "system.manage",
    labelKey: "admin.tab.audit",
    descriptionKey: "admin.overview.audit",
  },
];

export function adminModulePermissions(): Permission[] {
  return adminModules.map((module) => module.permission);
}

export function visibleAdminModules(can: (permission: Permission) => boolean): AdminModule[] {
  return adminModules.filter((module) => can(module.permission));
}

/** 顶栏入口：持有任一后台权限即可见。 */
export function canOpenAdmin(can: (permission: Permission) => boolean): boolean {
  return visibleAdminModules(can).length > 0;
}
