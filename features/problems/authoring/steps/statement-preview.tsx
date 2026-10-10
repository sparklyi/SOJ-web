import { memo } from "react";
import { MathText } from "@/components/soj/math-text";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemStatementInput } from "@/lib/api/types";

/** Local draft preview: sample input/output stay literal; prose shares the reader's renderer. */
export const StatementPreview = memo(function StatementPreview({ value, pending }: { value: ProblemStatementInput; pending: boolean }) {
  const { t } = useI18n();

  return (
    <div className="min-w-0 lg:sticky lg:top-24">
      <aside className="soj-account-panel grid min-w-0 gap-5 p-5 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto" aria-label={t("authoring.preview")} aria-busy={pending} tabIndex={0}>
        <header className="border-b border-soj-line/55 pb-4">
          <h2 className="text-xl font-semibold text-soj-text">{t("authoring.preview")}</h2>
          <p className="mt-2 text-xs text-soj-muted">{t("authoring.previewHint")}</p>
        </header>
        <PreviewText title={t("authoring.description")} text={value.description} />
        <PreviewText title={t("authoring.inputDescription")} text={value.inputDescription} />
        <PreviewText title={t("authoring.outputDescription")} text={value.outputDescription} />
        {value.samples.length > 0 ? (
          <section className="grid min-w-0 gap-4 border-t border-soj-line/55 pt-4" aria-label={t("authoring.samples")}>
            <h3 className="text-sm font-semibold text-soj-text">{t("authoring.samples")}</h3>
            {value.samples.map((sample, index) => (
              <div key={index} className="grid min-w-0 gap-3">
                <h4 className="text-sm font-medium text-soj-text">{t("authoring.sample", { index: index + 1 })}</h4>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  {[{ label: t("authoring.sampleInputIndexed", { index: index + 1 }), text: sample.input }, { label: t("authoring.sampleOutputIndexed", { index: index + 1 }), text: sample.output }].map(({ label, text }) => (
                    <figure key={label} className="min-w-0">
                      <figcaption className="text-xs text-soj-muted">{label}</figcaption>
                      <pre className="mt-2 overflow-x-auto rounded-soj-sm border border-soj-line/55 bg-soj-bg/25 p-3 font-mono text-xs text-soj-text">{text || "—"}</pre>
                    </figure>
                  ))}
                </div>
                {sample.explanation ? <PreviewText title={t("authoring.sampleExplanationIndexed", { index: index + 1 })} text={sample.explanation} /> : null}
              </div>
            ))}
          </section>
        ) : null}
        {value.hint ? <PreviewText title={t("authoring.hint")} text={value.hint} /> : null}
        {value.source ? <p className="break-words text-xs text-soj-muted">{t("authoring.source")}: {value.source}</p> : null}
      </aside>
    </div>
  );
});

function PreviewText({ title, text }: { title: string; text: string }) {
  const { t } = useI18n();
  return (
    <section className="grid min-w-0 gap-2">
      <h3 className="text-sm font-semibold text-soj-text">{title}</h3>
      {text.trim() ? <MathText text={text} errorLabel={t("authoring.formulaError")} className="min-w-0 overflow-x-auto break-words text-sm text-soj-text" /> : <p className="text-xs text-soj-muted">{t("authoring.previewEmpty")}</p>}
    </section>
  );
}
