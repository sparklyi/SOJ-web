"use client";

import { FormEvent, useEffect, useState } from "react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AuditAction, AuditEvent, AuditObjectType } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { listAuditEvents } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; events: AuditEvent[]; total: number };

const DEFAULT_PAGE_SIZE = 20;

type FilterState = {
  objectType: AuditObjectType | "all";
  objectId: string;
  actorId: string;
  action: AuditAction | "all";
};

const emptyFilter: FilterState = { objectType: "all", objectId: "", actorId: "", action: "all" };

const objectTypes: AuditObjectType[] = ["user", "language", "problem", "contest"];
const actions: AuditAction[] = [
  "user.role.granted",
  "user.role.revoked",
  "user.disabled",
  "user.enabled",
  "user.deleted",
  "language.enabled",
  "language.disabled",
  "problem.archived",
  "problem.restored",
  "contest.archived",
];

export function AuditLog() {
  const { t } = useI18n();

  return (
    <PermissionGate anyOf={["system.manage"]}>
      <Panel variant="flush" aria-label={t("admin.audit.title")}>
        <PanelHeader title={t("admin.audit.title")} description={t("admin.audit.description")} />
        <PanelBody className="p-0">
          <AuditBoard />
        </PanelBody>
      </Panel>
    </PermissionGate>
  );
}

function AuditBoard() {
  const { t } = useI18n();
  const [draft, setDraft] = useState<FilterState>(emptyFilter);
  const [applied, setApplied] = useState<FilterState>(emptyFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAuditEvents(
          {
            objectType: applied.objectType === "all" ? undefined : applied.objectType,
            objectId: applied.objectId.trim() ? Number(applied.objectId) : undefined,
            actorId: applied.actorId.trim() ? Number(applied.actorId) : undefined,
            action: applied.action === "all" ? undefined : applied.action,
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
        setState({ status: "ready", events: result.items, total: result.total });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("admin.failed") });
      }
    }

    void start();
    return () => {
      active = false;
    };
  }, [applied, page, pageSize, t]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setApplied(draft);
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 border-b border-soj-line px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid content-end gap-2">
          <span className="text-sm text-soj-text">{t("admin.audit.objectType")}</span>
          <Select
            value={draft.objectType}
            onValueChange={(value) => setDraft((current) => ({ ...current, objectType: value as FilterState["objectType"] }))}
          >
            <SelectTrigger className="w-full" aria-label={t("admin.audit.objectType")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.audit.allObjectTypes")}</SelectItem>
              {objectTypes.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(objectTypeKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          name="admin-audit-object-id"
          label={t("admin.audit.objectId")}
          inputMode="numeric"
          value={draft.objectId}
          onChange={(event) => setDraft((current) => ({ ...current, objectId: event.target.value }))}
        />
        <Input
          name="admin-audit-actor-id"
          label={t("admin.audit.actorId")}
          inputMode="numeric"
          value={draft.actorId}
          onChange={(event) => setDraft((current) => ({ ...current, actorId: event.target.value }))}
        />
        <div className="grid content-end gap-2">
          <span className="text-sm text-soj-text">{t("admin.audit.action")}</span>
          <Select value={draft.action} onValueChange={(value) => setDraft((current) => ({ ...current, action: value as FilterState["action"] }))}>
            <SelectTrigger className="w-full" aria-label={t("admin.audit.action")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.audit.allActions")}</SelectItem>
              {actions.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(actionKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 md:col-span-2 xl:col-span-4">
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
            }}
          >
            {t("admin.reset")}
          </Button>
        </div>
      </form>

      {state.status === "loading" ? <p className="p-4 text-sm text-soj-muted">{t("admin.loading")}</p> : null}
      {state.status === "error" ? <p className="p-4 text-sm text-soj-danger">{state.message}</p> : null}
      {state.status === "ready" && state.events.length === 0 ? <EmptyState title={t("admin.audit.empty")} compact /> : null}
      {state.status === "ready" && state.events.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("admin.audit.time")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.audit.operator")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.audit.action")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.audit.object")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.audit.reason")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {state.events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs text-soj-muted">{formatTime(event.createdAt)}</TableCell>
                <TableCell className="text-xs text-soj-text">
                  {event.actorUsername ?? (event.actorUserId != null ? `#${event.actorUserId}` : "—")}
                </TableCell>
                <TableCell className="text-xs text-soj-text">{t(actionKey(event.action))}</TableCell>
                <TableCell className="font-mono text-xs text-soj-muted">{objectLabel(event, t)}</TableCell>
                <TableCell className="max-w-[280px] truncate text-xs text-soj-muted">{event.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
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
    </div>
  );
}

function objectTypeKey(objectType: AuditObjectType): MessageKey {
  return `admin.objectType.${objectType}` as MessageKey;
}

function actionKey(action: AuditAction): MessageKey {
  return `admin.action.${action}` as MessageKey;
}

function objectLabel(event: AuditEvent, t: (key: MessageKey) => string): string {
  const type = t(objectTypeKey(event.objectType));
  const role = event.metadata?.role;
  return typeof role === "string" ? `${type} #${event.objectId} · ${role}` : `${type} #${event.objectId}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
