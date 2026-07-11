"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProblemAuthoringState, ProblemDifficulty, ProblemStatementInput, ProblemUpdateInput, ProblemVisibility } from "@/lib/api/types";

export function ProblemMetadataForm({ state, busy, onSave }: { state: ProblemAuthoringState; busy: boolean; onSave: (input: ProblemUpdateInput) => Promise<void> }) {
  const problem = state.problem;
  const [form, setForm] = useState(() => metadataForm(problem));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      title: form.title.trim(),
      slug: form.slug.trim(),
      difficulty: form.difficulty,
      visibility: form.visibility,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      timeLimitMs: Number(form.timeLimitMs),
      memoryLimitKb: Number(form.memoryLimitKb),
    });
  }

  return (
    <form className="soj-account-panel grid gap-4 p-5" onSubmit={submit}>
      <SectionTitle eyebrow="01 / Metadata" title="Problem settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Input id="problem-title" label="Title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        <Input id="problem-slug" label="Slug" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledSelect label="Difficulty" value={form.difficulty} onChange={(value) => setForm((current) => ({ ...current, difficulty: value as ProblemDifficulty }))} options={["easy", "medium", "hard"]} />
        <LabeledSelect label="Visibility" value={form.visibility} onChange={(value) => setForm((current) => ({ ...current, visibility: value as ProblemVisibility }))} options={["private", "public", "contest_only"]} />
      </div>
      <Input id="problem-tags" label="Tags" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="problem-time-limit" label="Time limit (ms)" min="1" required type="number" value={form.timeLimitMs} onChange={(event) => setForm((current) => ({ ...current, timeLimitMs: event.target.value }))} />
        <Input id="problem-memory-limit" label="Memory limit (KB)" min="1" required type="number" value={form.memoryLimitKb} onChange={(event) => setForm((current) => ({ ...current, memoryLimitKb: event.target.value }))} />
      </div>
      <div><Button type="submit" variant="secondary" loading={busy}>Save settings</Button></div>
    </form>
  );
}

export function ProblemStatementForm({ state, busy, onSave }: { state: ProblemAuthoringState; busy: boolean; onSave: (input: ProblemStatementInput) => Promise<void> }) {
  const [form, setForm] = useState(() => statementForm(state));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      title: form.title.trim(),
      description: form.description,
      inputDescription: form.inputDescription,
      outputDescription: form.outputDescription,
      samples: form.sampleInput || form.sampleOutput ? [{ input: form.sampleInput, output: form.sampleOutput }] : [],
      hint: form.hint,
      source: form.source,
    });
  }

  return (
    <form className="soj-account-panel grid gap-4 p-5" onSubmit={submit}>
      <SectionTitle eyebrow="02 / Statement" title="Problem statement" />
      <Input id="statement-title" label="Statement title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
      <Textarea id="statement-description" className="min-h-48" label="Description" required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea id="statement-input-description" label="Input description" value={form.inputDescription} onChange={(event) => setForm((current) => ({ ...current, inputDescription: event.target.value }))} />
        <Textarea id="statement-output-description" label="Output description" value={form.outputDescription} onChange={(event) => setForm((current) => ({ ...current, outputDescription: event.target.value }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea id="statement-sample-input" label="Sample input" value={form.sampleInput} onChange={(event) => setForm((current) => ({ ...current, sampleInput: event.target.value }))} />
        <Textarea id="statement-sample-output" label="Sample output" value={form.sampleOutput} onChange={(event) => setForm((current) => ({ ...current, sampleOutput: event.target.value }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input id="statement-source" label="Source" value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} />
        <Input id="statement-hint" label="Hint" value={form.hint} onChange={(event) => setForm((current) => ({ ...current, hint: event.target.value }))} />
      </div>
      <div><Button type="submit" variant="secondary" loading={busy}>Save statement</Button></div>
    </form>
  );
}

export function TestcaseUploadForm({ busy, onUpload }: { busy: boolean; onUpload: (input: { archive: File; caseCount: number }) => Promise<void> }) {
  const [archive, setArchive] = useState<File | null>(null);
  const [caseCount, setCaseCount] = useState("1");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!archive) return;
    await onUpload({ archive, caseCount: Number(caseCount) });
  }

  return (
    <form className="soj-account-panel grid gap-4 p-5" onSubmit={submit}>
      <SectionTitle eyebrow="03 / Test data" title="Testcase archive" />
      <Input id="testcase-archive" accept=".zip,application/zip" label="Archive" required type="file" onChange={(event) => setArchive(event.target.files?.[0] ?? null)} />
      <Input id="testcase-case-count" label="Case count" min="1" required type="number" value={caseCount} onChange={(event) => setCaseCount(event.target.value)} />
      <div><Button type="submit" variant="secondary" loading={busy} disabled={!archive}>Upload archive</Button></div>
    </form>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-soj-line/55 pb-4">
      <p className="font-mono text-xs uppercase text-soj-muted">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-soj-text">{title}</h2>
    </div>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-soj-text">
      {label}
      <select className="h-10 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
      </select>
    </label>
  );
}

function metadataForm(problem: ProblemAuthoringState["problem"]) {
  return {
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    visibility: problem.visibility,
    tags: problem.tags.join(", "),
    timeLimitMs: String(problem.timeLimitMs),
    memoryLimitKb: String(problem.memoryLimitKb),
  };
}

function statementForm(state: ProblemAuthoringState) {
  return {
    title: state.statement?.title ?? state.problem.title,
    description: state.statement?.description ?? "",
    inputDescription: state.statement?.inputDescription ?? "",
    outputDescription: state.statement?.outputDescription ?? "",
    sampleInput: state.statement?.samples[0]?.input ?? "",
    sampleOutput: state.statement?.samples[0]?.output ?? "",
    hint: state.statement?.hint ?? "",
    source: state.statement?.source ?? "",
  };
}
