"use client";

import { useEffect, useState } from "react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { createBrowserApiClient } from "@/lib/api/client";
import type { JudgeLanguage } from "@/lib/api/types";
import { listAdminLanguages, updateAdminLanguage } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; languages: JudgeLanguage[]; total: number };

const PAGE_SIZE = 20;

export function LanguageAdmin() {
  const { t } = useI18n();

  return (
    <PermissionGate anyOf={["system.manage"]}>
      <Panel variant="flush" aria-label={t("admin.languages.title")}>
        <PanelHeader title={t("admin.languages.title")} description={t("admin.languages.description")} />
        <PanelBody className="p-0">
          <LanguageTable />
        </PanelBody>
      </Panel>
    </PermissionGate>
  );
}

function LanguageTable() {
  const { t } = useI18n();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAdminLanguages(page, PAGE_SIZE, createBrowserApiClient());
        if (!active) return;
        if (result.items.length === 0 && result.total > 0 && page > 1) {
          setPage((current) => current - 1);
          return;
        }
        setState({ status: "ready", languages: result.items, total: result.total });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("admin.failed") });
      }
    }

    void start();
    return () => {
      active = false;
    };
  }, [page, t]);

  async function toggle(language: JudgeLanguage) {
    setPendingId(language.id);
    setFeedback(null);
    try {
      const updated = await updateAdminLanguage(language.id, { enabled: !language.enabled }, createBrowserApiClient());
      setState((current) =>
        current.status === "ready"
          ? { status: "ready", total: current.total, languages: current.languages.map((item) => (item.id === updated.id ? updated : item)) }
          : current,
      );
      setFeedback({ tone: "success", message: t("admin.languages.updated") });
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("admin.languages.failed") });
    } finally {
      setPendingId(null);
    }
  }

  if (state.status === "loading") {
    return <p className="p-4 text-sm text-soj-muted">{t("admin.loading")}</p>;
  }
  if (state.status === "error") {
    return <p className="p-4 text-sm text-soj-danger">{state.message}</p>;
  }
  if (state.languages.length === 0) {
    return <EmptyState title={t("admin.empty")} />;
  }

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("admin.languages.name")}</TableHeaderCell>
            <TableHeaderCell>{t("admin.languages.limits")}</TableHeaderCell>
            <TableHeaderCell>{t("admin.status")}</TableHeaderCell>
            <TableHeaderCell className="text-right">{t("admin.actions")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <tbody>
          {state.languages.map((language) => (
            <TableRow key={language.id}>
              <TableCell>
                <span className="text-sm text-soj-text">{language.name}</span>
                {language.version ? <span className="ml-2 font-mono text-xs text-soj-muted">{language.version}</span> : null}
                <span className="mt-0.5 block font-mono text-xs text-soj-faint">{language.engineLanguageId}</span>
              </TableCell>
              <TableCell className="font-mono text-xs text-soj-muted">
                {language.defaultTimeLimitMs} ms · {Math.round(language.defaultMemoryLimitKb / 1024)} MB
              </TableCell>
              <TableCell>
                <StatusPill tone={language.enabled ? "success" : "warning"}>
                  {language.enabled ? t("admin.languages.enabled") : t("admin.languages.disabled")}
                </StatusPill>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant={language.enabled ? "secondary" : "solid"}
                  size="sm"
                  loading={pendingId === language.id}
                  onClick={() => void toggle(language)}
                >
                  {language.enabled ? t("admin.languages.disable") : t("admin.languages.enable")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      {state.total > 0 ? <Pagination page={page} pageSize={PAGE_SIZE} total={state.total} onPageChange={setPage} /> : null}
      {feedback ? (
        <p className={feedback.tone === "danger" ? "px-4 pb-4 text-sm text-soj-danger" : "px-4 pb-4 text-sm text-soj-success"}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
