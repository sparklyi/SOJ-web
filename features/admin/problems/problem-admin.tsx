"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AuthoringProblem, ProblemPublicationStatus, ProblemVisibility } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { archiveAdminProblem, listAdminProblems, restoreAdminProblem } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; problems: AuthoringProblem[] };

type FilterState = {
  keyword: string;
  status: ProblemPublicationStatus | "all";
  owner: string;
  visibility: ProblemVisibility | "all";
  tag: string;
};

const emptyFilter: FilterState = { keyword: "", status: "all", owner: "", visibility: "all", tag: "" };

const publicationStatuses: ProblemPublicationStatus[] = ["draft", "in_review", "changes_requested", "published", "archived"];
const visibilities: ProblemVisibility[] = ["public", "private", "contest_only"];

export function ProblemAdmin() {
  const { t } = useI18n();

  return (
    <PermissionGate anyOf={["problem.manage_all"]}>
      <Panel variant="flush" aria-label={t("admin.problems.title")}>
        <PanelHeader title={t("admin.problems.title")} description={t("admin.problems.description")} />
        <PanelBody className="p-0">
          <ProblemBoard />
        </PanelBody>
      </Panel>
    </PermissionGate>
  );
}

function ProblemBoard() {
  const { t } = useI18n();
  const [draft, setDraft] = useState<FilterState>(emptyFilter);
  const [applied, setApplied] = useState<FilterState>(emptyFilter);
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAdminProblems(
          {
            keyword: applied.keyword.trim() || undefined,
            status: applied.status === "all" ? undefined : applied.status,
            owner: applied.owner.trim() || undefined,
            visibility: applied.visibility === "all" ? undefined : applied.visibility,
            tag: applied.tag.trim() || undefined,
            pageSize: 50,
          },
          createBrowserApiClient(),
        );
        if (active) setState({ status: "ready", problems: result.items });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("admin.failed") });
      }
    }

    void start();
    return () => {
      active = false;
    };
  }, [applied, reloadToken, t]);

  function submitFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
  }

  async function toggleArchive(problem: AuthoringProblem) {
    setPendingId(problem.id);
    setFeedback(null);
    try {
      if (problem.publicationStatus === "archived") {
        await restoreAdminProblem(problem.id, createBrowserApiClient());
        setFeedback({ tone: "success", message: t("admin.problems.restored") });
      } else {
        await archiveAdminProblem(problem.id, createBrowserApiClient());
        setFeedback({ tone: "success", message: t("admin.problems.archived") });
      }
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("admin.problems.failed") });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <form onSubmit={submitFilter} className="grid gap-3 border-b border-soj-line px-4 py-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          name="admin-problem-keyword"
          label={t("admin.problems.keyword")}
          value={draft.keyword}
          onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
        />
        <Input
          name="admin-problem-owner"
          label={t("admin.problems.owner")}
          placeholder={t("admin.problems.ownerPlaceholder")}
          value={draft.owner}
          onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
        />
        <div className="grid content-end gap-2">
          <span className="text-sm text-soj-text">{t("admin.status")}</span>
          <Select
            value={draft.status}
            onValueChange={(value) => setDraft((current) => ({ ...current, status: value as FilterState["status"] }))}
          >
            <SelectTrigger className="w-full" aria-label={t("admin.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.problems.allStatuses")}</SelectItem>
              {publicationStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(publicationStatusKey(status))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid content-end gap-2">
          <span className="text-sm text-soj-text">{t("admin.problems.visibility")}</span>
          <Select
            value={draft.visibility}
            onValueChange={(value) => setDraft((current) => ({ ...current, visibility: value as FilterState["visibility"] }))}
          >
            <SelectTrigger className="w-full" aria-label={t("admin.problems.visibility")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.problems.allVisibilities")}</SelectItem>
              {visibilities.map((visibility) => (
                <SelectItem key={visibility} value={visibility}>
                  {t(visibilityKey(visibility))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Input
            name="admin-problem-tag"
            label={t("admin.problems.tag")}
            value={draft.tag}
            onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value }))}
          />
          <Button type="submit" variant="secondary" size="md" aria-label={t("admin.filter")}>
            <Search aria-hidden className="h-4 w-4" />
            {t("admin.filter")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setDraft(emptyFilter);
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
      {state.status === "ready" && state.problems.length === 0 ? (
        <EmptyState title={t("admin.empty")} description={t("admin.problems.description")} compact />
      ) : null}
      {state.status === "ready" && state.problems.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("admin.problems.problem")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.problems.owner")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.status")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.problems.visibility")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("admin.actions")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {state.problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell>
                  <span className="text-sm text-soj-text">{problem.title}</span>
                  <span className="mt-0.5 block font-mono text-xs text-soj-faint">
                    #{problem.id} · {problem.slug}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-soj-muted">#{problem.ownerUserId}</TableCell>
                <TableCell>
                  <StatusPill tone={publicationTone(problem.publicationStatus)}>
                    {t(publicationStatusKey(problem.publicationStatus))}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-xs text-soj-muted">{t(visibilityKey(problem.visibility))}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant={problem.publicationStatus === "archived" ? "solid" : "danger"}
                    size="sm"
                    loading={pendingId === problem.id}
                    onClick={() => void toggleArchive(problem)}
                  >
                    {problem.publicationStatus === "archived" ? t("admin.problems.restore") : t("admin.problems.archive")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : null}
      {feedback ? (
        <p className={feedback.tone === "danger" ? "px-4 py-3 text-sm text-soj-danger" : "px-4 py-3 text-sm text-soj-success"}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

function publicationStatusKey(status: ProblemPublicationStatus): MessageKey {
  switch (status) {
    case "draft":
      return "authoring.publicationStatus.draft";
    case "in_review":
      return "authoring.publicationStatus.inReview";
    case "changes_requested":
      return "authoring.publicationStatus.changesRequested";
    case "published":
      return "authoring.publicationStatus.published";
    case "archived":
      return "authoring.publicationStatus.archived";
  }
}

function visibilityKey(visibility: ProblemVisibility): MessageKey {
  switch (visibility) {
    case "private":
      return "authoring.visibility.private";
    case "public":
      return "authoring.visibility.public";
    case "contest_only":
      return "authoring.visibility.contestOnly";
  }
}

function publicationTone(status: ProblemPublicationStatus) {
  switch (status) {
    case "published":
      return "success" as const;
    case "in_review":
    case "changes_requested":
      return "warning" as const;
    case "archived":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}
