"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AuthoringStatement, ProblemStatementInput } from "@/lib/api/types";

type SampleDraft = { input: string; output: string; explanation: string };

type StatementStepProps = {
  statement?: AuthoringStatement;
  busy: boolean;
  onSave: (input: ProblemStatementInput) => Promise<void> | void;
};

/** ② 题面：标题来自 problem.title，界面不再单独编辑。 */
export function StatementStep({ statement, busy, onSave }: StatementStepProps) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => statementForm(statement));
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const samples = form.samples.filter((sample) => sample.input.trim() || sample.output.trim());
    if (samples.some((sample) => !sample.input.trim() || !sample.output.trim())) {
      setError(t("authoring.sampleIncomplete"));
      return;
    }
    setError("");
    void onSave({
      description: form.description,
      inputDescription: form.inputDescription,
      outputDescription: form.outputDescription,
      samples: samples.map((sample) => ({
        input: sample.input,
        output: sample.output,
        ...(sample.explanation.trim() ? { explanation: sample.explanation } : {}),
      })),
      hint: form.hint,
      source: form.source,
    });
  }

  function updateSample(index: number, patch: Partial<SampleDraft>) {
    setForm((current) => ({ ...current, samples: current.samples.map((sample, i) => (i === index ? { ...sample, ...patch } : sample)) }));
  }

  return (
    <form className="soj-account-panel grid gap-5 p-5" onSubmit={submit}>
      <div className="border-b border-soj-line/55 pb-4">
        <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.statement")}</p>
        <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.statement.heading")}</h2>
      </div>

      <Textarea id="statement-description" className="min-h-48" label={t("authoring.description")} required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea id="statement-input-description" label={t("authoring.inputDescription")} value={form.inputDescription} onChange={(event) => setForm((current) => ({ ...current, inputDescription: event.target.value }))} />
        <Textarea id="statement-output-description" label={t("authoring.outputDescription")} value={form.outputDescription} onChange={(event) => setForm((current) => ({ ...current, outputDescription: event.target.value }))} />
      </div>

      <section className="grid gap-3 border-t border-soj-line/55 pt-4" aria-label={t("authoring.samples")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-soj-text">{t("authoring.samples")}</h3>
          <Button type="button" size="sm" variant="ghost" onClick={() => setForm((current) => ({ ...current, samples: [...current.samples, emptySample()] }))}>
            <Plus aria-hidden className="h-3.5 w-3.5" />
            {t("authoring.addSample")}
          </Button>
        </div>
        <p className="text-xs text-soj-muted">{t("authoring.samplesHint")}</p>
        {form.samples.length === 0 ? <p className="text-sm text-soj-muted">{t("authoring.noSamples")}</p> : null}
        {form.samples.map((sample, index) => (
          <div key={index} className="grid gap-3 rounded-soj-md border border-soj-line/55 bg-soj-bg/25 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase text-soj-muted">{t("authoring.sample", { index: index + 1 })}</span>
              <Button type="button" size="sm" variant="ghost" aria-label={t("authoring.removeSample")} onClick={() => setForm((current) => ({ ...current, samples: current.samples.filter((_, i) => i !== index) }))}>
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
                {t("authoring.removeSample")}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Textarea id={`statement-sample-${index}-input`} label={t("authoring.sampleInputIndexed", { index: index + 1 })} value={sample.input} onChange={(event) => updateSample(index, { input: event.target.value })} />
              <Textarea id={`statement-sample-${index}-output`} label={t("authoring.sampleOutputIndexed", { index: index + 1 })} value={sample.output} onChange={(event) => updateSample(index, { output: event.target.value })} />
            </div>
            <Input id={`statement-sample-${index}-explanation`} label={t("authoring.sampleExplanationIndexed", { index: index + 1 })} value={sample.explanation} onChange={(event) => updateSample(index, { explanation: event.target.value })} />
          </div>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Input id="statement-source" label={t("authoring.source")} value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} />
        <Input id="statement-hint" label={t("authoring.hint")} value={form.hint} onChange={(event) => setForm((current) => ({ ...current, hint: event.target.value }))} />
      </div>

      {error ? <p className="text-sm text-soj-danger" role="alert">{error}</p> : null}
      <div>
        <Button type="submit" variant="secondary" loading={busy}>{t("authoring.saveStatement")}</Button>
      </div>
    </form>
  );
}

function emptySample(): SampleDraft {
  return { input: "", output: "", explanation: "" };
}

function statementForm(statement?: AuthoringStatement) {
  return {
    description: statement?.description ?? "",
    inputDescription: statement?.inputDescription ?? "",
    outputDescription: statement?.outputDescription ?? "",
    samples: statement ? statement.samples.map((sample) => ({ input: sample.input, output: sample.output, explanation: sample.explanation ?? "" })) : [emptySample()],
    hint: statement?.hint ?? "",
    source: statement?.source ?? "",
  };
}
