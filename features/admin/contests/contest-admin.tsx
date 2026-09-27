"use client";

import { FormEvent, useEffect, useState } from "react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AdminContest, AdminContestInput, AdminContestStatus, ContestVisibility } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { archiveAdminContest, createAdminContest, listAdminContests, updateAdminContest } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; contests: AdminContest[]; total: number };

const DEFAULT_PAGE_SIZE = 20;

const statuses: AdminContestStatus[] = ["draft", "published", "running", "ended", "archived"];
const visibilities: ContestVisibility[] = ["public", "private"];

export function ContestAdmin() {
  const { t } = useI18n();

  return (
    <PermissionGate anyOf={["contest.manage_all"]}>
      <Panel variant="flush" aria-label={t("admin.contests.title")}>
        <PanelHeader title={t("admin.contests.title")} description={t("admin.contests.description")} />
        <PanelBody className="p-0">
          <ContestBoard />
        </PanelBody>
      </Panel>
    </PermissionGate>
  );
}

function ContestBoard() {
  const { t } = useI18n();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<AdminContestStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editing, setEditing] = useState<AdminContest | "new" | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listAdminContests(
          {
            keyword: keyword.trim() || undefined,
            status: status === "all" ? undefined : status,
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
        setState({ status: "ready", contests: result.items, total: result.total });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("admin.failed") });
      }
    }

    void start();
    return () => {
      active = false;
    };
  }, [keyword, status, page, pageSize, reloadToken, t]);

  async function save(input: AdminContestInput) {
    setSaving(true);
    setFeedback(null);
    try {
      if (editing === "new") {
        await createAdminContest(input, createBrowserApiClient());
      } else if (editing) {
        await updateAdminContest(editing.id, input, createBrowserApiClient());
      }
      setEditing(null);
      setFeedback({ tone: "success", message: t("admin.contests.saved") });
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("admin.contests.failed") });
    } finally {
      setSaving(false);
    }
  }

  async function archive(contest: AdminContest) {
    setPendingId(contest.id);
    setFeedback(null);
    try {
      await archiveAdminContest(contest.id, createBrowserApiClient());
      setFeedback({ tone: "success", message: t("admin.contests.archived") });
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("admin.contests.failed") });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setReloadToken((token) => token + 1);
        }}
        className="grid gap-3 border-b border-soj-line px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto] sm:items-end"
      >
        <Input
          name="admin-contest-keyword"
          label={t("admin.problems.keyword")}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <div className="grid gap-2">
          <span className="text-sm text-soj-text">{t("admin.status")}</span>
          <Select value={status} onValueChange={(value) => setStatus(value as AdminContestStatus | "all")}>
            <SelectTrigger className="w-full" aria-label={t("admin.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.problems.allStatuses")}</SelectItem>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(contestStatusKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary">
            {t("admin.filter")}
          </Button>
          <Button type="button" onClick={() => setEditing("new")}>
            {t("admin.contests.create")}
          </Button>
        </div>
      </form>

      {editing ? (
        <ContestForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          saving={saving}
          onSubmit={(input) => void save(input)}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {state.status === "loading" ? <p className="p-4 text-sm text-soj-muted">{t("admin.loading")}</p> : null}
      {state.status === "error" ? <p className="p-4 text-sm text-soj-danger">{state.message}</p> : null}
      {state.status === "ready" && state.contests.length === 0 ? <EmptyState title={t("admin.contests.empty")} compact /> : null}
      {state.status === "ready" && state.contests.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("admin.contests.titleField")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.status")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.contests.visibility")}</TableHeaderCell>
              <TableHeaderCell>{t("admin.contests.startAt")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("admin.actions")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {state.contests.map((contest) => (
              <TableRow key={contest.id}>
                <TableCell>
                  <span className="text-sm text-soj-text">{contest.title}</span>
                  <span className="mt-0.5 block font-mono text-xs text-soj-faint">#{contest.id}</span>
                </TableCell>
                <TableCell>
                  <StatusPill tone={contest.status === "archived" ? "neutral" : "success"}>{t(contestStatusKey(contest.status))}</StatusPill>
                </TableCell>
                <TableCell className="text-xs text-soj-muted">
                  {contest.visibility === "private" ? t("authoring.visibility.private") : t("authoring.visibility.public")}
                </TableCell>
                <TableCell className="font-mono text-xs text-soj-muted">{formatDate(contest.startsAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(contest)}>
                      {t("admin.contests.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={contest.status === "archived"}
                      loading={pendingId === contest.id}
                      onClick={() => void archive(contest)}
                    >
                      {t("admin.contests.archive")}
                    </Button>
                  </div>
                </TableCell>
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
      {feedback ? (
        <p className={feedback.tone === "danger" ? "px-4 py-3 text-sm text-soj-danger" : "px-4 py-3 text-sm text-soj-success"}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

type ProblemRow = { problemId: string; alias: string };

type ContestFormProps = {
  initial: AdminContest | null;
  saving: boolean;
  onSubmit: (input: AdminContestInput) => void;
  onCancel: () => void;
};

function ContestForm({ initial, saving, onSubmit, onCancel }: ContestFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [visibility, setVisibility] = useState<ContestVisibility>(initial?.visibility ?? "public");
  const [status, setStatus] = useState<AdminContestStatus>(initial?.status ?? "draft");
  const [startAt, setStartAt] = useState(toLocalInput(initial?.startsAt ?? ""));
  const [endAt, setEndAt] = useState(toLocalInput(initial?.endsAt ?? ""));
  const [freezeAt, setFreezeAt] = useState(toLocalInput(initial?.freezeAt ?? ""));
  const [inviteCode, setInviteCode] = useState("");
  const [problems, setProblems] = useState<ProblemRow[]>(
    (initial?.problems ?? []).map((problem) => ({ problemId: String(problem.problemId), alias: problem.alias })),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      visibility,
      status,
      startAt: fromLocalInput(startAt),
      endAt: fromLocalInput(endAt),
      freezeAt: fromLocalInput(freezeAt),
      inviteCode: inviteCode.trim() || undefined,
      problems: problems
        .filter((row) => row.problemId.trim() !== "" && row.alias.trim() !== "")
        .map((row) => ({ problemId: Number(row.problemId), alias: row.alias.trim() })),
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 border-b border-soj-line bg-soj-surface/40 px-4 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="admin-contest-title" label={t("admin.contests.titleField")} value={title} onChange={(event) => setTitle(event.target.value)} required />
        <div className="grid gap-2">
          <span className="text-sm text-soj-text">{t("admin.contests.visibility")}</span>
          <Select value={visibility} onValueChange={(value) => setVisibility(value as ContestVisibility)}>
            <SelectTrigger className="w-full" aria-label={t("admin.contests.visibility")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilities.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "private" ? t("authoring.visibility.private") : t("authoring.visibility.public")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <span className="text-sm text-soj-text">{t("admin.status")}</span>
          <Select value={status} onValueChange={(value) => setStatus(value as AdminContestStatus)}>
            <SelectTrigger className="w-full" aria-label={t("admin.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(contestStatusKey(value))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          name="admin-contest-start"
          type="datetime-local"
          label={t("admin.contests.startAt")}
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          required
        />
        <Input
          name="admin-contest-end"
          type="datetime-local"
          label={t("admin.contests.endAt")}
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          required
        />
        <Input
          name="admin-contest-freeze"
          type="datetime-local"
          label={t("admin.contests.freezeAt")}
          value={freezeAt}
          onChange={(event) => setFreezeAt(event.target.value)}
          required
        />
        <Input
          name="admin-contest-invite"
          label={t("admin.contests.inviteCode")}
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <span className="text-sm text-soj-text">{t("admin.contests.problems")}</span>
        {problems.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <Input
              name={`admin-contest-problem-${index}`}
              label={t("admin.contests.problemId")}
              value={row.problemId}
              onChange={(event) =>
                setProblems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, problemId: event.target.value } : item)))
              }
            />
            <Input
              name={`admin-contest-alias-${index}`}
              label={t("admin.contests.alias")}
              value={row.alias}
              onChange={(event) =>
                setProblems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, alias: event.target.value } : item)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProblems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            >
              {t("admin.contests.removeProblem")}
            </Button>
          </div>
        ))}
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setProblems((current) => [...current, { problemId: "", alias: "" }])}>
            {t("admin.contests.addProblem")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={saving}>
          {t("admin.contests.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("admin.contests.cancel")}
        </Button>
      </div>
    </form>
  );
}

function contestStatusKey(status: AdminContestStatus): MessageKey {
  return `admin.contestStatus.${status}` as MessageKey;
}

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
