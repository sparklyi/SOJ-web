"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserApiClient } from "@/lib/api/client";
import type { AuthoringProblem, ProblemDifficulty } from "@/lib/api/types";

type ManagerState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "error"; message: string }
  | { status: "ready"; problems: AuthoringProblem[] };

export function ProblemManager() {
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const { t, localize } = useI18n();
  const [state, setState] = useState<ManagerState>({ status: "loading" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", difficulty: "medium" as ProblemDifficulty, tags: "", timeLimitMs: "1000", memoryLimitKb: "262144" });
  const viewState: ManagerState = authStatus === "loading" ? { status: "loading" } : authStatus === "anonymous" ? { status: "auth" } : state;

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;

    async function start() {
      try {
        const result = await createBrowserApiClient().problems.listMine();
        if (active) setState({ status: "ready", problems: result.items });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : t("authoring.unableLoadProblems") });
      }
    }
    void start();

    return () => {
      active = false;
    };
  }, [authStatus, t]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const problem = await createBrowserApiClient().problems.create({
        title: form.title.trim(),
        slug: form.slug.trim(),
        difficulty: form.difficulty,
        visibility: "private",
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        timeLimitMs: Number(form.timeLimitMs),
        memoryLimitKb: Number(form.memoryLimitKb),
      });
      router.push(localize(`/manage/problems/${problem.id}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("authoring.unableCreateProblem"));
      setCreating(false);
    }
  }

  return (
    <PageShell>
      <div className="grid gap-6">
        <header className="grid gap-3 border-b border-soj-line/70 pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="font-mono text-xs uppercase text-soj-accent">{t("authoring.console")}</p>
            <h1 className="mt-2 text-4xl font-semibold text-soj-text md:text-5xl">{t("authoring.title")}</h1>
          </div>
          <StatusPill tone={viewState.status === "ready" ? "accent" : "neutral"}>{managerStatusLabel(t, viewState)}</StatusPill>
        </header>

        {viewState.status === "auth" ? <AccessRequired /> : null}
        {viewState.status === "error" ? <Message tone="danger">{viewState.message}</Message> : null}
        {viewState.status === "loading" ? <Message>{t("authoring.loadingAuthorWorkspace")}</Message> : null}

        {viewState.status === "ready" ? (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="soj-account-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-soj-line/60 px-5 py-4">
                <h2 className="text-xl font-semibold text-soj-text">{t("authoring.ownedProblems")}</h2>
                <span className="font-mono text-xs text-soj-muted">{viewState.problems.length}</span>
              </div>
              {viewState.problems.length > 0 ? (
                <div className="divide-y divide-soj-line/50">
                  {viewState.problems.map((problem) => (
                    <LocalizedLink key={problem.id} href={`/manage/problems/${problem.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-soj-surface/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-soj-text">{problem.title}</span>
                          <StatusPill tone={problem.publicationStatus === "published" ? "success" : "warning"}>{publicationStatusLabel(t, problem.publicationStatus)}</StatusPill>
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-soj-muted">{problem.slug}</p>
                      </div>
                      <span className="font-mono text-xs text-soj-accent">{t("authoring.edit")}</span>
                    </LocalizedLink>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-soj-muted">{t("authoring.noAuthoredProblems")}</p>
              )}
            </section>

            <form className="soj-account-panel grid gap-4 p-5" onSubmit={handleCreate}>
              <div>
                <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.newDraft")}</p>
                <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.createProblem")}</h2>
              </div>
              <Input id="create-problem-title" label={t("authoring.titleLabel")} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <Input id="create-problem-slug" label={t("authoring.slug")} required pattern="[a-z0-9]+(?:[-_][a-z0-9]+)*" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <label className="grid gap-2 text-sm font-medium text-soj-text">
                {t("authoring.difficulty")}
                <select className="h-10 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as ProblemDifficulty }))}>
                  <option value="easy">{t("problems.difficulty.easy")}</option>
                  <option value="medium">{t("problems.difficulty.medium")}</option>
                  <option value="hard">{t("problems.difficulty.hard")}</option>
                </select>
              </label>
              <Input id="create-problem-tags" label={t("authoring.tags")} value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input id="create-problem-time" label={t("authoring.time")} min="1" required type="number" value={form.timeLimitMs} onChange={(event) => setForm((current) => ({ ...current, timeLimitMs: event.target.value }))} />
                <Input id="create-problem-memory" label={t("authoring.memory")} min="1" required type="number" value={form.memoryLimitKb} onChange={(event) => setForm((current) => ({ ...current, memoryLimitKb: event.target.value }))} />
              </div>
              {error ? <p className="text-sm text-soj-danger" role="alert">{error}</p> : null}
              <Button type="submit" loading={creating}>{t("authoring.createDraft")}</Button>
            </form>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

function AccessRequired() {
  const { t } = useI18n();

  return (
    <section className="soj-account-panel grid gap-4 p-6">
      <h2 className="text-xl font-semibold text-soj-text">{t("authoring.authRequired")}</h2>
      <LocalizedLink className="text-sm text-soj-accent" href="/auth/login">{t("authoring.openLogin")}</LocalizedLink>
    </section>
  );
}

function Message({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" }) {
  return <p className={tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-muted"}>{children}</p>;
}

function managerStatusLabel(t: ReturnType<typeof useI18n>["t"], state: ManagerState) {
  if (state.status === "ready") return t("authoring.ownedCount", { count: state.problems.length });
  if (state.status === "loading") return t("authoring.loading");
  if (state.status === "auth") return t("authoring.authRequired");
  return t("authoring.error");
}

function publicationStatusLabel(t: ReturnType<typeof useI18n>["t"], status: AuthoringProblem["publicationStatus"]) {
  if (status === "published") return t("authoring.publicationStatus.published");
  if (status === "archived") return t("authoring.publicationStatus.archived");
  return t("authoring.publicationStatus.draft");
}
