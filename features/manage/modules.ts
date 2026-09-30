import { canAccessAuthoring, canViewReviewQueue, gatePermissions } from "@/lib/auth/gates";
import type { Permission } from "@/lib/auth/permissions";
import type { MessageKey } from "@/lib/i18n/messages";

export type ManageModuleKey = "authoring" | "review" | "rejudge";

/**
 * Gate names come from `lib/auth/gates.ts` (shared with the backend
 * `authz.Combos()`), plus the single-permission rejudge gate. A gate is an
 * "any of" rule for every module here.
 */
export type ManageGate = "problem.authoring.access" | "problem.review.queue" | "submission.rejudge";

export type ManageModule = {
  key: ManageModuleKey;
  path: string;
  gate: ManageGate;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
};

/**
 * 工作台注册表：顶栏入口与 `/manage` 概览卡片都从这一份数据派生。
 *
 * 与 `features/admin/modules.ts` 同构，区别是这里一个模块对应一条命名组合门
 * 而不是单个权限（出题、审核都是组合规则，见 `lib/auth/gates.ts`）。
 * 新增工作台页面时改这一处，导航显隐与落地页卡片会同时跟上。
 */
export const manageModules: readonly ManageModule[] = [
  {
    key: "authoring",
    path: "/manage/problems",
    gate: "problem.authoring.access",
    labelKey: "manage.card.authoring.label",
    descriptionKey: "manage.card.authoring.description",
  },
  {
    key: "review",
    path: "/manage/reviews",
    gate: "problem.review.queue",
    labelKey: "manage.card.review.label",
    descriptionKey: "manage.card.review.description",
  },
  {
    key: "rejudge",
    path: "/manage/rejudge",
    gate: "submission.rejudge",
    labelKey: "manage.card.rejudge.label",
    descriptionKey: "manage.card.rejudge.description",
  },
];

/** The permissions a gate reads. Used by the route-level `PermissionGate` union. */
export function manageGatePermissions(gate: ManageGate): readonly Permission[] {
  switch (gate) {
    case "problem.authoring.access":
      return gatePermissions["problem.authoring.access"];
    case "problem.review.queue":
      return gatePermissions["problem.review.queue"];
    case "submission.rejudge":
      return ["submission.rejudge"];
  }
}

/**
 * Union of every module gate. Every gate is an "any of" rule today, so passing
 * this to `PermissionGate` is exactly "at least one workbench card is open".
 */
export function manageModulePermissions(): Permission[] {
  const permissions = new Set<Permission>();
  for (const entry of manageModules) {
    for (const permission of manageGatePermissions(entry.gate)) {
      permissions.add(permission);
    }
  }
  return [...permissions];
}

export function canOpenManageGate(gate: ManageGate, can: (permission: Permission) => boolean): boolean {
  switch (gate) {
    case "problem.authoring.access":
      return canAccessAuthoring(can);
    case "problem.review.queue":
      return canViewReviewQueue(can);
    case "submission.rejudge":
      return can("submission.rejudge");
  }
}

/** 概览页卡片：只展示该账号真的用得上的工作台。 */
export function visibleManageModules(can: (permission: Permission) => boolean): ManageModule[] {
  return manageModules.filter((module) => canOpenManageGate(module.gate, can));
}

/** 顶栏入口：持有任一工作台门即可见。 */
export function canOpenManage(can: (permission: Permission) => boolean): boolean {
  return visibleManageModules(can).length > 0;
}
