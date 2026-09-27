"use client";

import { FormEvent, useEffect, useState } from "react";
import { Info, KeyRound } from "lucide-react";
import { PermissionGate, roleMessageKey } from "@/components/auth/permission-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { PermissionCatalogEntry, PermissionScope, RolePermissionEntry, RolePermissionMatrix } from "@/lib/api/types";
import type { Permission, Role } from "@/lib/auth/permissions";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";
import { getRolePermissionMatrix, updateRolePermissions } from "./api";

type MatrixState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matrix: RolePermissionMatrix };

type Feedback = { tone: "success" | "danger"; message: string };

/** The groups the matrix renders, in display order. */
const groupOrder = ["problem", "submission", "contest", "judge", "user", "role", "system", "audit"] as const;
type PermissionGroup = (typeof groupOrder)[number];

const REASON_MAX_LENGTH = 500;

export function RolePermissionMatrix() {
  return (
    <PermissionGate anyOf={["role.permission.manage"]}>
      <RolePermissionBoard />
    </PermissionGate>
  );
}

function RolePermissionBoard() {
  const { t } = useI18n();
  const [state, setState] = useState<MatrixState>({ status: "loading" });
  /** Working permission sets for roles the operator has toggled, keyed by role code. */
  const [edits, setEdits] = useState<Record<string, Permission[]>>({});
  const [reasonRole, setReasonRole] = useState<Role | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<Role | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;

    getRolePermissionMatrix(createBrowserApiClient())
      .then((matrix) => {
        if (!active) return;
        setState({ status: "ready", matrix });
        setEdits({});
      })
      .catch((cause) => {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("admin.failed") });
      });

    return () => {
      active = false;
    };
  }, [t]);

  function closeReason() {
    setReasonRole(null);
    setReason("");
    setReasonError(null);
  }

  function toggle(role: RolePermissionEntry, permission: PermissionCatalogEntry, checked: boolean) {
    if (state.status !== "ready") return;
    const catalog = state.matrix.permissions;
    setEdits((current) => {
      const next = new Set(current[role.code] ?? role.permissions);
      if (checked) next.add(permission.code);
      else next.delete(permission.code);
      const ordered = catalog.filter((entry) => next.has(entry.code)).map((entry) => entry.code);
      if (samePermissions(ordered, role.permissions)) {
        const rest = { ...current };
        delete rest[role.code];
        return rest;
      }
      return { ...current, [role.code]: ordered };
    });
  }

  async function save(role: RolePermissionEntry, reasonText: string) {
    const permissions = edits[role.code] ?? role.permissions;
    setSavingRole(role.code);
    setFeedback(null);
    try {
      const updated = await updateRolePermissions(role.code, { permissions, reason: reasonText }, createBrowserApiClient());
      setState((current) =>
        current.status === "ready"
          ? { status: "ready", matrix: { ...current.matrix, roles: current.matrix.roles.map((item) => (item.code === role.code ? updated : item)) } }
          : current,
      );
      setEdits((current) => {
        const rest = { ...current };
        delete rest[role.code];
        return rest;
      });
      closeReason();
      setFeedback({ tone: "success", message: t("admin.roles.saved") });
    } catch (cause) {
      setFeedback({ tone: "danger", message: rolePermissionError(cause, t) });
    } finally {
      setSavingRole(null);
    }
  }

  function submitReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status !== "ready" || !reasonRole) return;
    const target = state.matrix.roles.find((role) => role.code === reasonRole);
    if (!target) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(t("admin.roles.reasonRequired"));
      return;
    }
    if (trimmed.length > REASON_MAX_LENGTH) {
      setReasonError(t("admin.roles.reasonTooLong"));
      return;
    }
    void save(target, trimmed);
  }

  return (
    <Panel variant="flush" aria-label={t("admin.roles.title")}>
      <PanelHeader title={t("admin.roles.title")} description={t("admin.roles.description")} />
      <PanelBody className="p-0">
        {state.status === "loading" ? <p className="p-4 text-sm text-soj-muted">{t("admin.loading")}</p> : null}
        {state.status === "error" ? <p className="p-4 text-sm text-soj-danger">{state.message}</p> : null}
        {state.status === "ready" && state.matrix.permissions.length === 0 ? (
          <EmptyState icon={KeyRound} title={t("admin.roles.empty")} compact />
        ) : null}
        {state.status === "ready" && state.matrix.permissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="sticky left-0 z-20 bg-soj-bg-raised">{t("admin.roles.permission")}</TableHeaderCell>
                  {state.matrix.roles.map((role) => (
                    <RoleHeader
                      key={role.code}
                      role={role}
                      dirty={isDirty(role, edits)}
                      saving={savingRole === role.code}
                      onSave={() => {
                        setReason("");
                        setReasonError(null);
                        setFeedback(null);
                        setReasonRole(role.code);
                      }}
                    />
                  ))}
                </TableRow>
              </TableHead>
              <tbody>
                {groupOrder.map((group) => {
                  const rows = state.matrix.permissions.filter((permission) => permissionGroup(permission.code) === group);
                  if (rows.length === 0) return null;
                  return (
                    <GroupRows
                      key={group}
                      group={group}
                      rows={rows}
                      roles={state.matrix.roles}
                      edits={edits}
                      onToggle={toggle}
                    />
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : null}
        {feedback ? (
          <p className={feedback.tone === "danger" ? "px-4 py-3 text-sm text-soj-danger" : "px-4 py-3 text-sm text-soj-success"}>
            {feedback.message}
          </p>
        ) : null}
      </PanelBody>

      {reasonRole ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && savingRole === null) closeReason();
          }}
        >
          <DialogContent className="grid gap-5 p-5">
            <header>
              <DialogTitle>{t("admin.roles.reasonTitle")}</DialogTitle>
              <DialogDescription>{t("admin.roles.reasonDescription")}</DialogDescription>
            </header>
            <form onSubmit={submitReason} className="grid gap-4">
              <Input
                name="role-permission-reason"
                label={t("admin.roles.reasonLabel")}
                placeholder={t("admin.roles.reasonPlaceholder")}
                value={reason}
                maxLength={REASON_MAX_LENGTH}
                error={reasonError ?? undefined}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError(null);
                }}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" disabled={savingRole !== null} onClick={closeReason}>
                  {t("admin.roles.cancel")}
                </Button>
                <Button type="submit" variant="solid" loading={savingRole !== null}>
                  {t("admin.roles.confirm")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </Panel>
  );
}

type GroupRowsProps = {
  group: PermissionGroup;
  rows: PermissionCatalogEntry[];
  roles: RolePermissionEntry[];
  edits: Record<string, Permission[]>;
  onToggle: (role: RolePermissionEntry, permission: PermissionCatalogEntry, checked: boolean) => void;
};

function GroupRows({ group, rows, roles, edits, onToggle }: GroupRowsProps) {
  const { t } = useI18n();

  return (
    <>
      <TableRow className="bg-soj-bg-raised/40 hover:bg-soj-bg-raised/40">
        <TableCell colSpan={roles.length + 1} className="text-xs font-medium uppercase tracking-[0.12em] text-soj-faint">
          {t(groupKey(group))}
        </TableCell>
      </TableRow>
      {rows.map((permission) => (
        <TableRow key={permission.code}>
          <TableCell className="sticky left-0 z-10 bg-soj-bg-raised">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-mono text-xs text-soj-text">{permission.code}</span>
              <Badge tone={permission.scope === "contest" ? "info" : "neutral"} size="sm">
                {t(scopeKey(permission.scope))}
              </Badge>
              <ConsumerTooltip consumer={permission.consumer} label={t("admin.roles.consumer")} />
            </span>
          </TableCell>
          {roles.map((role) => (
            <PermissionCell key={role.code} role={role} permission={permission} edits={edits} onToggle={onToggle} />
          ))}
        </TableRow>
      ))}
    </>
  );
}

function PermissionCell({
  role,
  permission,
  edits,
  onToggle,
}: {
  role: RolePermissionEntry;
  permission: PermissionCatalogEntry;
  edits: Record<string, Permission[]>;
  onToggle: GroupRowsProps["onToggle"];
}) {
  const { t } = useI18n();
  const disabledReason = disabledCellReason(role, permission, t);
  const working = edits[role.code] ?? role.permissions;
  const checked = role.locked || working.includes(permission.code);

  return (
    <TableCell>
      <span className="flex justify-center">
        <input
          type="checkbox"
          className="h-4 w-4 accent-soj-accent disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={`${role.code} ${permission.code}`}
          title={disabledReason ?? undefined}
          checked={checked}
          disabled={disabledReason !== null}
          onChange={(event) => onToggle(role, permission, event.target.checked)}
        />
      </span>
    </TableCell>
  );
}

function RoleHeader({ role, dirty, saving, onSave }: { role: RolePermissionEntry; dirty: boolean; saving: boolean; onSave: () => void }) {
  const { t } = useI18n();

  return (
    <TableHeaderCell className="align-top">
      <div className="grid gap-1.5">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-soj-text">
          {t(roleMessageKey(role.code))}
          <Badge tone={role.scope === "contest" ? "info" : "neutral"} size="sm">
            {t(scopeKey(role.scope))}
          </Badge>
        </span>
        {role.locked ? (
          <span className="text-[10px] uppercase tracking-wide text-soj-faint" title={t("admin.roles.lockedHint")}>
            {t("admin.roles.locked")}
          </span>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="secondary"
            disabled={!dirty}
            loading={saving}
            aria-label={`${t("admin.roles.save")} ${t(roleMessageKey(role.code))}`}
            onClick={onSave}
          >
            {t("admin.roles.save")}
          </Button>
        )}
        {dirty ? <span className="text-[10px] text-soj-warning">{t("admin.roles.dirty")}</span> : null}
      </div>
    </TableHeaderCell>
  );
}

function ConsumerTooltip({ consumer, label }: { consumer: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="grid h-4 w-4 place-items-center rounded-soj-sm text-soj-faint transition hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          <Info aria-hidden className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{consumer}</TooltipContent>
    </Tooltip>
  );
}

function permissionGroup(code: Permission): PermissionGroup {
  const prefix = code.split(".")[0];
  return (groupOrder as readonly string[]).includes(prefix) ? (prefix as PermissionGroup) : "system";
}

function groupKey(group: PermissionGroup): MessageKey {
  return `admin.roles.group.${group}` as MessageKey;
}

function scopeKey(scope: PermissionScope): MessageKey {
  return `admin.roles.scope.${scope}` as MessageKey;
}

/** Why a cell can never be edited, or null when it is editable. */
function disabledCellReason(role: RolePermissionEntry, permission: PermissionCatalogEntry, t: Translator): string | null {
  if (role.locked) return t("admin.roles.lockedHint");
  if (!permission.delegable) return t("admin.roles.nonDelegable");
  if (permission.scope !== role.scope) return t("admin.roles.scopeMismatch");
  return null;
}

function isDirty(role: RolePermissionEntry, edits: Record<string, Permission[]>): boolean {
  const working = edits[role.code];
  return working !== undefined && !samePermissions(working, role.permissions);
}

function samePermissions(left: readonly Permission[], right: readonly Permission[]): boolean {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((permission) => set.has(permission));
}

const errorKeys: Record<string, MessageKey> = {
  "role.not_found": "admin.roles.error.role.not_found",
  not_found: "admin.roles.error.not_found",
  "role.locked": "admin.roles.error.role.locked",
  "role.permissions_required": "admin.roles.error.role.permissions_required",
  "role.permission_invalid": "admin.roles.error.role.permission_invalid",
  "role.permission_not_delegable": "admin.roles.error.role.permission_not_delegable",
  "role.permission_scope_mismatch": "admin.roles.error.role.permission_scope_mismatch",
  "role.permission_reason_required": "admin.roles.error.role.permission_reason_required",
  forbidden: "admin.roles.error.auth.forbidden",
  "auth.forbidden": "admin.roles.error.auth.forbidden",
};

function rolePermissionError(cause: unknown, t: Translator): string {
  if (cause instanceof ApiError && errorKeys[cause.code]) {
    return t(errorKeys[cause.code]);
  }
  return cause instanceof Error ? cause.message : t("admin.roles.failed");
}
