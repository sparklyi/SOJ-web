"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PermissionGate, rejudgeStatusMessageKey } from "@/components/auth/permission-gate";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBrowserApiClient } from "@/lib/api/client";
import type { RejudgeBatch, RejudgeBatchDetail, RejudgeBatchStatus } from "@/lib/api/types";
import { useContestJudgeAccess } from "@/lib/auth/contest-access";
import { cancelRejudgeBatch, createRejudgeBatch, getRejudgeBatch, listRejudgeBatches, type RejudgeTarget } from "./api";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; batches: RejudgeBatch[] };

type TargetKind = RejudgeTarget["kind"];

/**
 * Global console. It covers the capabilities the session can answer on its own:
 * `submission.rejudge` for a problem target, and `problem.manage_all` (carried by
 * every full-access role) for either target kind.
 */
export function RejudgeConsole() {
  const { t } = useI18n();

  return (
    <PageShell title={t("rejudge.title")} description={t("rejudge.description")}>
      <PermissionGate anyOf={["submission.rejudge", "problem.manage_all"]}>
        <RejudgeBoard />
      </PermissionGate>
    </PageShell>
  );
}

/**
 * Contest console. The backend authorizes a contest rejudge through
 * `requireContestJudge` — admin/root, the contest owner, `contest.manage`, or
 * `contest.judge` — and the last two are only ever granted per contest with
 * `role.invalid_role` guarding the global endpoint, so the decision has to come
 * from the contest payload rather than the session.
 */
export function ContestRejudgeConsole({ contestId }: { contestId: number }) {
  const { t } = useI18n();
  const access = useContestJudgeAccess(contestId);

  return (
    <PageShell title={`${t("rejudge.title")} · #${contestId}`} description={t("rejudge.contestDescription")}>
      <PermissionGate anyOf={["submission.rejudge", "problem.manage_all"]} override={access.state}>
        <RejudgeBoard contestId={contestId} />
      </PermissionGate>
    </PageShell>
  );
}

function RejudgeBoard({ contestId }: { contestId?: number }) {
  const { t } = useI18n();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailState, setDetailState] = useState<{ batchId: number; detail: RejudgeBatchDetail } | null>(null);
  const [targetKind, setTargetKind] = useState<TargetKind>("problem");
  const [targetValue, setTargetValue] = useState("");
  const [reason, setReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [pending, setPending] = useState<"create" | "cancel" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);

  // A contest-scoped console is pinned to its own contest, so the target is not
  // editable and the list is filtered server-side.
  const fixedKind: TargetKind = contestId === undefined ? targetKind : "contest";
  const fixedTarget = contestId === undefined ? targetValue : String(contestId);
  // Memoized so the load effects below do not restart on every render.
  const filter = useMemo(() => (contestId === undefined ? {} : { contestId }), [contestId]);

  const loadBatches = useCallback(async () => {
    try {
      const result = await listRejudgeBatches(filter, createBrowserApiClient());
      setState({ status: "ready", batches: result.items });
      setSelectedId((current) => (current && result.items.some((batch) => batch.id === current) ? current : (result.items[0]?.id ?? null)));
    } catch (cause) {
      setState({ status: "error", message: cause instanceof Error ? cause.message : t("rejudge.failed") });
    }
  }, [filter, t]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const result = await listRejudgeBatches(filter, createBrowserApiClient());
        if (!active) return;
        setState({ status: "ready", batches: result.items });
        setSelectedId((current) => (current && result.items.some((batch) => batch.id === current) ? current : (result.items[0]?.id ?? null)));
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("rejudge.failed") });
      }
    }

    void start();

    return () => {
      active = false;
    };
  }, [filter, t]);

  const refreshDetail = useCallback(
    async (id: number) => {
      try {
        setDetailState({ batchId: id, detail: await getRejudgeBatch(id, createBrowserApiClient()) });
      } catch {
        setDetailState(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedId === null) return;

    const batchId = selectedId;
    let active = true;

    getRejudgeBatch(batchId, createBrowserApiClient())
      .then((detail) => {
        if (active) setDetailState({ batchId, detail });
      })
      .catch(() => {
        if (active) setDetailState(null);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  // The detail panel is keyed by batch so a response for a previous selection is
  // never rendered against the current one.
  const detail = detailState && detailState.batchId === selectedId ? detailState.detail : null;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number.parseInt(fixedTarget, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFeedback({ tone: "danger", message: t("rejudge.needTarget") });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ tone: "danger", message: t("rejudge.needReason") });
      return;
    }

    setPending("create");
    setFeedback(null);
    try {
      const target: RejudgeTarget = fixedKind === "problem" ? { kind: "problem", problemId: parsed } : { kind: "contest", contestId: parsed };
      const batch = await createRejudgeBatch(target, reason.trim(), createBrowserApiClient());
      setReason("");
      setTargetValue("");
      setFeedback({ tone: "success", message: t("rejudge.created") });
      setSelectedId(batch.id);
      await loadBatches();
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("rejudge.failed") });
    } finally {
      setPending(null);
    }
  }

  async function handleCancel() {
    if (selectedId === null) return;
    if (!cancelReason.trim()) {
      setFeedback({ tone: "danger", message: t("rejudge.needReason") });
      return;
    }
    setPending("cancel");
    setFeedback(null);
    try {
      await cancelRejudgeBatch(selectedId, cancelReason.trim(), createBrowserApiClient());
      setCancelReason("");
      setFeedback({ tone: "success", message: t("rejudge.canceled") });
      await loadBatches();
      await refreshDetail(selectedId);
    } catch (cause) {
      setFeedback({ tone: "danger", message: cause instanceof Error ? cause.message : t("rejudge.failed") });
    } finally {
      setPending(null);
    }
  }

  const cancelable = detail ? detail.batch.status === "queued" || detail.batch.status === "running" : false;

  return (
    <div className="grid gap-6">
      {/* 表单栅格与全站其它表单一致：每个控件自带「标签在正上方」，两列等宽。
          原先是手写的 180/1fr/2fr 三列 —— 标签有的浮在第二个控件头顶，
          有的控件下面还压着一行说明，读不出哪个标签管哪个框。 */}
      <form onSubmit={handleCreate} className="grid gap-4 rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {contestId === undefined ? (
            <>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-soj-text">{t("rejudge.target")}</span>
                {/* 原生 <select> 的选项面板归系统渲染，深色页面上会弹出一块白底。
                    全站下拉一律走共享 Select。 */}
                <Select value={targetKind} onValueChange={(value) => setTargetKind(value as TargetKind)}>
                  <SelectTrigger className="w-full" aria-label={t("rejudge.target")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="problem">{t("rejudge.targetProblem")}</SelectItem>
                    <SelectItem value="contest">{t("rejudge.targetContest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                name="rejudge-target"
                label={targetKind === "problem" ? t("rejudge.targetProblem") : t("rejudge.targetContest")}
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                inputMode="numeric"
                helperText={t("rejudge.targetHint")}
              />
            </>
          ) : (
            <p className="text-sm text-soj-muted sm:col-span-2">
              {t("rejudge.target")} <span className="font-mono text-soj-text">{t("rejudge.targetContest")} #{contestId}</span>
            </p>
          )}
          <Input
            name="rejudge-reason"
            className="sm:col-span-2"
            label={t("rejudge.reason")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("rejudge.reasonPlaceholder")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={pending === "create"}>
            {t("rejudge.create")}
          </Button>
          {feedback ? (
            <span className={feedback.tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-success"}>{feedback.message}</span>
          ) : null}
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-4">
          <h2 className="mb-3 text-sm font-medium text-soj-text">{t("rejudge.batches")}</h2>
          {state.status === "loading" ? <p className="text-sm text-soj-muted">{t("status.pending")}</p> : null}
          {state.status === "error" ? <p className="text-sm text-soj-danger">{state.message}</p> : null}
          {state.status === "ready" && state.batches.length === 0 ? <p className="text-sm text-soj-muted">{t("rejudge.batchesEmpty")}</p> : null}
          {state.status === "ready" && state.batches.length > 0 ? (
            <ul className="grid gap-2">
              {state.batches.map((batch) => (
                <li key={batch.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(batch.id)}
                    className={
                      batch.id === selectedId
                        ? "w-full rounded-soj-md border border-soj-accent/60 bg-soj-accent/10 px-3 py-2 text-left"
                        : "w-full rounded-soj-md border border-soj-line/70 bg-soj-bg-raised/60 px-3 py-2 text-left transition hover:border-soj-accent/40"
                    }
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-soj-muted">#{batch.id}</span>
                      <StatusPill tone={rejudgeTone(batch.status)}>{t(rejudgeStatusMessageKey(batch.status))}</StatusPill>
                    </span>
                    <span className="mt-1 block truncate text-sm text-soj-text">{batch.reason}</span>
                    <span className="mt-1 block font-mono text-xs text-soj-muted">
                      {batch.problemId ? `${t("rejudge.targetProblem")} ${batch.problemId}` : `${t("rejudge.targetContest")} ${batch.contestId}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="min-w-0 grid gap-4">
          {detail ? (
            <>
              <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-mono text-sm text-soj-muted">#{detail.batch.id}</h2>
                    <p className="mt-1 text-sm leading-6 text-soj-text">{detail.batch.reason}</p>
                  </div>
                  <StatusPill tone={rejudgeTone(detail.batch.status)}>{t(rejudgeStatusMessageKey(detail.batch.status))}</StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label={t("rejudge.progress", { completed: detail.batch.completedCount, total: detail.batch.totalCount })} />
                  <Metric label={`${t("rejudgeStatus.failed")} ${detail.batch.failedCount}`} />
                  <Metric label={`${t("rejudgeStatus.canceled")} ${detail.batch.canceledCount}`} />
                  <Metric label={`${t("roles.userId")} ${detail.batch.requestedBy}`} />
                </div>
                {detail.batch.errorMessage ? <p className="mt-3 text-sm text-soj-danger">{detail.batch.errorMessage}</p> : null}
                {cancelable ? (
                  <div className="mt-5 grid gap-3 border-t border-soj-line/70 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <Input
                      name="rejudge-cancel-reason"
                      label={t("rejudge.cancelPrompt")}
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                    {/* 这是一个**次级**动作：页面的主操作是「创建批次」（扁平银）。
                        整页唯一的一抹红如果是这枚按钮，权重就压过了主操作。
                        红色只保留 hue，尺寸降一档。 */}
                    <Button type="button" variant="danger" size="sm" loading={pending === "cancel"} onClick={() => void handleCancel()}>
                      {t("rejudge.cancel")}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 p-5">
                <h3 className="mb-3 text-sm font-medium text-soj-text">{t("rejudge.items")}</h3>
                {detail.items.length === 0 ? (
                  <p className="text-sm text-soj-muted">{t("rejudge.itemsEmpty")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-soj-muted">
                          <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("rejudge.submission")}</th>
                          <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("rejudge.task")}</th>
                          <th className="border-b border-soj-line/70 py-2 pr-4 font-normal">{t("home.status")}</th>
                          <th className="border-b border-soj-line/70 py-2 font-normal">{t("rejudge.error")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr key={item.id}>
                            <td className="border-b border-soj-line/40 py-2 pr-4 font-mono text-soj-text">#{item.submissionId}</td>
                            <td className="border-b border-soj-line/40 py-2 pr-4 font-mono text-soj-muted">{item.taskId ?? "—"}</td>
                            <td className="border-b border-soj-line/40 py-2 pr-4">
                              <StatusPill tone={rejudgeTone(item.status)}>{t(rejudgeStatusMessageKey(item.status))}</StatusPill>
                            </td>
                            <td className="border-b border-soj-line/40 py-2 text-soj-muted">{item.errorMessage ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-soj-lg border border-soj-line/70 bg-soj-surface/50 px-6 py-10 text-center text-sm text-soj-muted">
              {t("rejudge.batchesEmpty")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label }: { label: string }) {
  return (
    <div className="rounded-soj-md border border-soj-line/60 bg-soj-bg-raised/60 px-3 py-2">
      <p className="font-mono text-xs text-soj-muted">{label}</p>
    </div>
  );
}

function rejudgeTone(status: RejudgeBatchStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "running":
      return "accent" as const;
    case "canceled":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}
