"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { StatusPill } from "@/components/soj/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";
import type { AuthoringProblem, ProblemDifficulty } from "@/lib/api/types";

type ManagerState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "error"; message: string }
  | { status: "ready"; problems: AuthoringProblem[] };

export function ProblemManager() {
  const router = useRouter();
  const [state, setState] = useState<ManagerState>({ status: "loading" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", difficulty: "medium" as ProblemDifficulty, tags: "", timeLimitMs: "1000", memoryLimitKb: "262144" });

  useEffect(() => {
    async function start() {
      if (getApiMode() === "http" && !restoreSession(window.localStorage)) {
        setState({ status: "auth" });
        return;
      }
      try {
        const result = await createBrowserApiClient().problems.listMine();
        setState({ status: "ready", problems: result.items });
      } catch (cause) {
        setState({ status: "error", message: cause instanceof Error ? cause.message : "Unable to load authored problems." });
      }
    }
    void start();
  }, []);

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
      router.push(`/manage/problems/${problem.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create problem.");
      setCreating(false);
    }
  }

  return (
    <PageShell>
      <div className="grid gap-6">
        <header className="grid gap-3 border-b border-soj-line/70 pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="font-mono text-xs uppercase text-soj-accent">Author console</p>
            <h1 className="mt-2 text-4xl font-semibold text-soj-text md:text-5xl">Problem authoring</h1>
          </div>
          <StatusPill tone={state.status === "ready" ? "accent" : "neutral"}>{state.status === "ready" ? `${state.problems.length} owned` : state.status}</StatusPill>
        </header>

        {state.status === "auth" ? <AccessRequired /> : null}
        {state.status === "error" ? <Message tone="danger">{state.message}</Message> : null}
        {state.status === "loading" ? <Message>Loading author workspace.</Message> : null}

        {state.status === "ready" ? (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="soj-account-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-soj-line/60 px-5 py-4">
                <h2 className="text-xl font-semibold text-soj-text">Owned problems</h2>
                <span className="font-mono text-xs text-soj-muted">{state.problems.length}</span>
              </div>
              {state.problems.length > 0 ? (
                <div className="divide-y divide-soj-line/50">
                  {state.problems.map((problem) => (
                    <Link key={problem.id} href={`/manage/problems/${problem.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-soj-surface/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-soj-text">{problem.title}</span>
                          <StatusPill tone={problem.publicationStatus === "published" ? "success" : "warning"}>{problem.publicationStatus}</StatusPill>
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-soj-muted">{problem.slug}</p>
                      </div>
                      <span className="font-mono text-xs text-soj-accent">Edit</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-soj-muted">No authored problems.</p>
              )}
            </section>

            <form className="soj-account-panel grid gap-4 p-5" onSubmit={handleCreate}>
              <div>
                <p className="font-mono text-xs uppercase text-soj-muted">New draft</p>
                <h2 className="mt-2 text-xl font-semibold text-soj-text">Create problem</h2>
              </div>
              <Input id="create-problem-title" label="Title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              <Input id="create-problem-slug" label="Slug" required pattern="[a-z0-9]+(?:[-_][a-z0-9]+)*" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              <label className="grid gap-2 text-sm font-medium text-soj-text">
                Difficulty
                <select className="h-10 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as ProblemDifficulty }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <Input id="create-problem-tags" label="Tags" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input id="create-problem-time" label="Time (ms)" min="1" required type="number" value={form.timeLimitMs} onChange={(event) => setForm((current) => ({ ...current, timeLimitMs: event.target.value }))} />
                <Input id="create-problem-memory" label="Memory (KB)" min="1" required type="number" value={form.memoryLimitKb} onChange={(event) => setForm((current) => ({ ...current, memoryLimitKb: event.target.value }))} />
              </div>
              {error ? <p className="text-sm text-soj-danger" role="alert">{error}</p> : null}
              <Button type="submit" loading={creating}>Create draft</Button>
            </form>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

function AccessRequired() {
  return (
    <section className="soj-account-panel grid gap-4 p-6">
      <h2 className="text-xl font-semibold text-soj-text">Login required</h2>
      <Link className="text-sm text-soj-accent" href="/auth/login">Open login</Link>
    </section>
  );
}

function Message({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" }) {
  return <p className={tone === "danger" ? "text-sm text-soj-danger" : "text-sm text-soj-muted"}>{children}</p>;
}
