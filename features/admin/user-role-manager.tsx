"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserRoundSearch } from "lucide-react";
import { PermissionGate, roleMessageKey } from "@/components/auth/permission-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AdminUser, AdminUserStatus } from "@/lib/api/types";
import { globalRoles, type GlobalRole } from "@/lib/auth/permissions";
import { grantGlobalRole, listAdminUsers, revokeGlobalRole, updateAdminUser } from "./api";
import { UserProfileForm } from "./user-profile-form";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; users: AdminUser[]; total: number };

type FilterState = { keyword: string; status: AdminUserStatus | "all" };

const DEFAULT_PAGE_SIZE = 20;
const emptyFilter: FilterState = { keyword: "", status: "all" };
const statuses: AdminUserStatus[] = ["active", "disabled", "deleted"];

export function UserRoleManager() {
  return (
    <PermissionGate anyOf={["user.manage"]}>
      <UserBoard />
    </PermissionGate>
  );
}

function UserBoard() {
  const { t } = useI18n();
  const { user: viewer, refresh } = useAuth();
  const [draft, setDraft] = useState<FilterState>(emptyFilter);
  const [applied, setApplied] = useState<FilterState>(emptyFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [managingId, setManagingId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAdminUsers(
          {
            keyword: applied.keyword.trim() || undefined,
            status: applied.status === "all" ? undefined : applied.status,
            page,
            pageSize,
          },
          createBrowserApiClient(),
        );
        if (!active) return;
        if (result.items.length === 0 && result.total > 0 && page > 1) {
          setPage((current) => current - 1);
          return;
        }
        setState({ status: "ready", users: result.items, total: result.total });
        setManagingId((current) => result.items.some((user) => user.id === current) ? current : null);
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("roles.failed") });
      }
    }

    void start();
    return () => {
      active = false;
    };
  }, [applied, page, pageSize, reloadToken, t]);

  const managing = state.status === "ready" ? (state.users.find((item) => item.id === managingId) ?? null) : null;

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setApplied(draft);
  }

  async function toggleStatus(user: AdminUser) {
    setPendingId(user.id);
    setFeedback(null);
    const next: AdminUserStatus = user.status === "active" ? "disabled" : "active";
    try {
      await updateAdminUser(user.id, { status: next }, createBrowserApiClient());
      setFeedback({ tone: "success", message: next === "active" ? t("roles.enabled") : t("roles.disabled") });
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.statusFailed") });
    } finally {
      setPendingId(null);
    }
  }

  function profileUpdated(updated: AdminUser) {
    setState((current) => current.status === "ready" ? {
      ...current,
      users: current.users.map((user) => user.id === updated.id ? { ...user, handle: updated.handle, bio: updated.bio, updatedAt: updated.updatedAt } : user),
    } : current);
    setFeedback({ tone: "success", message: t("roles.profileSaved") });
    setReloadToken((token) => token + 1);
    if (updated.id === viewer?.id) void refresh();
  }

  return (
    <Panel variant="flush" aria-label={t("roles.title")}>
      <PanelHeader title={t("roles.title")} description={t("roles.description")} />
      <PanelBody className="p-0">
        <form
          onSubmit={submitFilter}
          className="grid gap-3 border-b border-soj-line px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto] sm:items-end"
        >
          <Input
            name="admin-user-keyword"
            label={t("roles.search")}
            placeholder={t("roles.searchPlaceholder")}
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
          />
          <div className="grid gap-2">
            <span className="text-sm text-soj-text">{t("admin.status")}</span>
            <Select
              value={draft.status}
              onValueChange={(value) => setDraft((current) => ({ ...current, status: value as FilterState["status"] }))}
            >
              <SelectTrigger className="w-full" aria-label={t("admin.status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("roles.allStatuses")}</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(userStatusKey(status))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary">
              {t("admin.filter")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(emptyFilter);
                setPage(1);
                setApplied(emptyFilter);
                setReloadToken((token) => token + 1);
              }}
            >
              {t("admin.reset")}
            </Button>
          </div>
        </form>

        {state.status === "loading" ? <p className="p-4 text-sm text-soj-muted">{t("admin.loading")}</p> : null}
        {state.status === "error" ? <p className="p-4 text-sm text-soj-danger">{state.message}</p> : null}
        {state.status === "ready" && state.users.length === 0 ? (
          <EmptyState icon={UserRoundSearch} title={t("roles.usersEmpty")} compact />
        ) : null}
        {state.status === "ready" && state.users.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("roles.users")}</TableHeaderCell>
                  <TableHeaderCell>{t("admin.status")}</TableHeaderCell>
                  <TableHeaderCell>{t("roles.globalRoles")}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t("admin.actions")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <tbody>
                {state.users.map((user) => {
                  const isSelf = user.id === viewer?.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <span className="text-sm text-soj-text">{user.handle}</span>
                        {isSelf ? <span className="ml-2 text-xs text-soj-faint">{t("roles.you")}</span> : null}
                        <span className="mt-0.5 block font-mono text-xs text-soj-muted">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={user.status === "active" ? "success" : "warning"}>{t(userStatusKey(user.status))}</StatusPill>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span key={role} className="rounded-soj-sm border border-soj-line/70 bg-soj-bg-raised/60 px-2 py-0.5 text-xs text-soj-muted">
                              {t(roleMessageKey(role))}
                            </span>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => setManagingId(user.id)}>
                            {t("roles.manage")}
                          </Button>
                          <Button
                            type="button"
                            variant={user.status === "active" ? "danger" : "solid"}
                            size="sm"
                            disabled={isSelf}
                            title={isSelf ? t("roles.selfDisableBlocked") : undefined}
                            loading={pendingId === user.id}
                            onClick={() => void toggleStatus(user)}
                          >
                            {user.status === "active" ? t("roles.disable") : t("roles.enable")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={state.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPage(1);
              setPageSize(size);
            }}
          />
        ) : null}
        {feedback ? (
          <p className={feedback.tone === "danger" ? "px-4 py-3 text-sm text-soj-danger" : "px-4 py-3 text-sm text-soj-success"}>
            {feedback.message}
          </p>
        ) : null}
      </PanelBody>

      {managing ? (
        <UserDialog
          key={managing.id}
          user={managing}
          viewerId={viewer?.id ?? null}
          onClose={() => setManagingId(null)}
          onChanged={() => setReloadToken((token) => token + 1)}
          onProfileUpdated={profileUpdated}
        />
      ) : null}
    </Panel>
  );
}

type UserDialogProps = {
  user: AdminUser;
  viewerId: number | null;
  onClose: () => void;
  onChanged: () => void;
  onProfileUpdated: (user: AdminUser) => void;
};

/**
 * 用户管理弹窗：编辑资料并管理全局角色。
 * 授予与撤销共用同一个原因输入——后端两者都要求原因，逐次弹出输入框反而更难用。
 */
function UserDialog({ user, viewerId, onClose, onChanged, onProfileUpdated }: UserDialogProps) {
  const { t } = useI18n();
  const { can } = useAuth();
  const canGrant = can("role.grant");
  const canRevoke = can("role.revoke");
  const isSelf = user.id === viewerId;
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  async function changeRole(role: GlobalRole, action: "grant" | "revoke") {
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("roles.needReason") });
      return;
    }
    setPending(`${action}-${role}`);
    setFeedback(null);
    try {
      if (action === "grant") {
        await grantGlobalRole(user.id, role, reason.trim(), createBrowserApiClient());
        setFeedback({ tone: "success", message: t("roles.granted") });
      } else {
        await revokeGlobalRole(user.id, role, reason.trim(), createBrowserApiClient());
        setFeedback({ tone: "success", message: t("roles.revoked") });
      }
      onChanged();
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("roles.failed") });
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="grid gap-5 p-5">
        <header className="min-w-0 pr-8">
          <DialogTitle className="break-words">{t("roles.manageTitle", { name: user.handle })}</DialogTitle>
          <DialogDescription className="break-words">
            #{user.id} · {user.email}
          </DialogDescription>
        </header>

        <UserProfileForm user={user} onSaved={onProfileUpdated} />

        <section className="grid gap-2 border-t border-soj-line/55 pt-4">
          <h3 className="text-sm font-medium text-soj-text">{t("roles.globalRoles")}</h3>
          <ul className="grid gap-2">
            {globalRoles.map((role) => {
              const held = user.roles.includes(role);
              const fixed = role === "user";
              return (
                <li key={role} className="flex items-center justify-between gap-3 rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/50 px-3 py-2">
                  <span className="text-sm text-soj-text">{t(roleMessageKey(role))}</span>
                  {fixed ? (
                    <span className="text-xs text-soj-faint">{t("roles.fixedRole")}</span>
                  ) : held && canRevoke ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="xs"
                      disabled={isSelf}
                      loading={pending === `revoke-${role}`}
                      onClick={() => void changeRole(role, "revoke")}
                    >
                      {t("roles.revoke")}
                    </Button>
                  ) : !held && canGrant ? (
                    <Button
                      type="button"
                      variant="solid"
                      size="xs"
                      disabled={isSelf}
                      loading={pending === `grant-${role}`}
                      onClick={() => void changeRole(role, "grant")}
                    >
                      {t("roles.grant")}
                    </Button>
                  ) : (
                    <span className="text-xs text-soj-faint">{held ? t("roles.current") : "—"}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {canGrant || canRevoke ? (
          <>
            <Input
              name="role-reason"
              label={t("roles.reasonPlaceholder")}
              value={reason}
              disabled={isSelf}
              onChange={(event) => setReason(event.target.value)}
            />
            {isSelf ? <p className="text-sm text-soj-muted">{t("roles.selfGrantBlocked")}</p> : null}
          </>
        ) : null}
        {feedback ? (
          <p className={feedback.tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-success"}>{feedback.message}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function userStatusKey(status: AdminUserStatus) {
  return `userStatus.${status}` as const;
}
