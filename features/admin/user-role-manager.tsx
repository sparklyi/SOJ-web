"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { UserRoundSearch } from "lucide-react";
import { PermissionGate, roleMessageKey } from "@/components/auth/permission-gate";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AdminUser, AdminUserStatus } from "@/lib/api/types";
import { globalRoles, type GlobalRole } from "@/lib/auth/permissions";
import { grantGlobalRole, listAdminUsers, revokeGlobalRole } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; users: AdminUser[] };

export function UserRoleManager() {
  const { t } = useI18n();

  return (
    <PageShell title={t("roles.title")} description={t("roles.description")}>
      <PermissionGate anyOf={["user.manage"]}>
        <UserRoleBoard />
      </PermissionGate>
    </PageShell>
  );
}

function UserRoleBoard() {
  const { t } = useI18n();
  const { user: viewer, can } = useAuth();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [roleToGrant, setRoleToGrant] = useState<GlobalRole>("author");
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  const canGrant = can("role.grant");
  const canRevoke = can("role.revoke");

  const loadUsers = useCallback(
    async (search: string) => {
      try {
        const result = await listAdminUsers(search ? { keyword: search } : {}, createBrowserApiClient());
        setState({ status: "ready", users: result.items });
        setSelectedId((current) => (current && result.items.some((item) => item.id === current) ? current : null));
      } catch (cause) {
        setState({ status: "error", message: cause instanceof Error ? cause.message : t("roles.failed") });
      }
    },
    [t],
  );

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAdminUsers({}, createBrowserApiClient());
        if (active) setState({ status: "ready", users: result.items });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("roles.failed") });
      }
    }

    void start();

    return () => {
      active = false;
    };
  }, [t]);

  async function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedId === null) {
      setFeedback({ tone: "danger", message: t("roles.needUser") });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("roles.needReason") });
      return;
    }
    setPending(`grant-${roleToGrant}`);
    setFeedback(null);
    try {
      await grantGlobalRole(selectedId, roleToGrant, reason.trim(), createBrowserApiClient());
      setReason("");
      setFeedback({ tone: "success", message: t("roles.granted") });
      await loadUsers(keyword);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.failed") });
    } finally {
      setPending(null);
    }
  }

  async function handleRevoke(role: GlobalRole) {
    if (selectedId === null) return;
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("roles.needReason") });
      return;
    }
    setPending(`revoke-${role}`);
    setFeedback(null);
    try {
      await revokeGlobalRole(selectedId, role, reason.trim(), createBrowserApiClient());
      setReason("");
      setFeedback({ tone: "success", message: t("roles.revoked") });
      await loadUsers(keyword);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.failed") });
    } finally {
      setPending(null);
    }
  }

  const selected = state.status === "ready" ? (state.users.find((item) => item.id === selectedId) ?? null) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <section className="min-w-0 grid gap-4 rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-4">
        <h2 className="text-sm font-medium text-soj-text">{t("roles.users")}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers(keyword.trim());
          }}
          className="grid gap-3"
        >
          <Input
            name="admin-user-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("roles.searchPlaceholder")}
            aria-label={t("roles.searchPlaceholder")}
          />
          {/* 按钮此前复用了 placeholder 的文案（两者都是「搜索用户名或邮箱」），
              于是同一句话在同一个表单里出现两遍：一次当提示，一次当动作。 */}
          <Button type="submit" variant="secondary" size="sm">
            {t("roles.searchAction")}
          </Button>
        </form>

        {state.status === "loading" ? <p className="text-sm text-soj-muted">{t("status.pending")}</p> : null}
        {state.status === "error" ? <p className="text-sm text-soj-danger">{state.message}</p> : null}
        {state.status === "ready" && state.users.length === 0 ? <p className="text-sm text-soj-muted">{t("roles.usersEmpty")}</p> : null}
        {state.status === "ready" && state.users.length > 0 ? (
          <ul className="grid gap-2">
            {state.users.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setFeedback(null);
                  }}
                  className={
                    item.id === selectedId
                      ? "w-full rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 px-3 py-2 text-left"
                      : "w-full rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/60 px-3 py-2 text-left transition hover:border-soj-accent/40"
                  }
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-soj-text">{item.handle}</span>
                    <StatusPill tone={item.status === "active" ? "success" : "warning"}>{t(userStatusKey(item.status))}</StatusPill>
                  </span>
                  <span className="mt-1 block truncate font-mono text-xs text-soj-muted">{item.email}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="min-w-0 grid gap-4">
        {selected ? (
          <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium text-soj-text">{selected.handle}</h2>
                <p className="mt-1 font-mono text-xs text-soj-muted">
                  #{selected.id} · {selected.email}
                </p>
              </div>
              <StatusPill tone={selected.status === "active" ? "success" : "warning"}>{t(userStatusKey(selected.status))}</StatusPill>
            </div>

            <div className="mt-5 border-t border-soj-line/70 pt-5">
              <h3 className="mb-3 text-sm font-medium text-soj-text">{t("roles.globalRoles")}</h3>
              <div className="flex flex-wrap gap-2">
                {selected.roles.length === 0 ? (
                  <p className="text-sm text-soj-muted">—</p>
                ) : (
                  selected.roles.map((role) => (
                    <span key={role} className="inline-flex items-center gap-2 rounded-soj-sm border border-soj-line/70 bg-soj-bg-raised/60 px-2 py-1">
                      <span className="text-xs text-soj-text">{t(roleMessageKey(role))}</span>
                      {canRevoke ? (
                        <button
                          type="button"
                          onClick={() => void handleRevoke(role)}
                          disabled={pending === `revoke-${role}`}
                          className="font-mono text-xs text-soj-muted transition hover:text-soj-danger disabled:opacity-45"
                        >
                          {t("roles.revoke")}
                        </button>
                      ) : null}
                    </span>
                  ))
                )}
              </div>
            </div>

            {canGrant ? (
              <form onSubmit={handleGrant} className="mt-5 grid gap-3 border-t border-soj-line/70 pt-5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_auto] sm:items-end">
                <div className="grid gap-2">
                  <span className="text-sm text-soj-text">{t("roles.role")}</span>
                  {/* 原生 <select> 的选项面板由系统渲染，在深色页面上会弹出一块白底。
                      全站下拉一律走共享 Select（Radix，position="popper" 已在其 Content 里给出）。 */}
                  <Select value={roleToGrant} onValueChange={(value) => setRoleToGrant(value as GlobalRole)}>
                    <SelectTrigger className="w-full" aria-label={t("roles.role")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {globalRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(roleMessageKey(role))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  name="role-reason"
                  label={t("roles.reasonPlaceholder")}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={selected.id === viewer?.id}
                  helperText={selected.id === viewer?.id ? t("roles.selfGrantBlocked") : undefined}
                />
                <Button type="submit" loading={pending === `grant-${roleToGrant}`} disabled={selected.id === viewer?.id}>
                  {t("roles.grant")}
                </Button>
              </form>
            ) : null}

            {feedback ? (
              <p className={feedback.tone === "danger" ? "mt-4 text-sm text-soj-danger" : "mt-4 text-sm text-soj-success"}>{feedback.message}</p>
            ) : null}
          </div>
        ) : (
          /* 未选中用户时，这里此前渲染的是左栏那个卡片标题本身（「用户」）——
             一块 700×360 的空面板里只有一个词，等于没有空态。 */
          <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50">
            <EmptyState icon={UserRoundSearch} title={t("roles.selectEmptyTitle")} description={t("roles.selectEmptyDescription")} />
          </div>
        )}
      </section>
    </div>
  );
}

function userStatusKey(status: AdminUserStatus) {
  return `userStatus.${status}` as const;
}
