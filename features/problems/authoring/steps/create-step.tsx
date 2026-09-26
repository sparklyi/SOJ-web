"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/providers/i18n-provider";
import type { ProblemCreateInput, ProblemDifficulty } from "@/lib/api/types";

const difficultyOptions: ProblemDifficulty[] = ["easy", "medium", "hard"];

type CreateStepProps = {
  busy: boolean;
  onCreate: (input: ProblemCreateInput) => Promise<void> | void;
};

/**
 * ① 建题。默认只发 `{title}`，服务端回落到平台默认值；展开高级设置后才把
 * 难度/标签/时间/内存一并发出去。slug 由服务端生成，界面不再有 slug 输入。
 */
export function CreateStep({ busy, onCreate }: CreateStepProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState({
    difficulty: "medium" as ProblemDifficulty,
    tags: "",
    timeLimitMs: "1000",
    memoryLimitKb: "262144",
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: ProblemCreateInput = { title: title.trim() };
    if (advancedOpen) {
      input.difficulty = advanced.difficulty;
      input.tags = advanced.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      input.timeLimitMs = Number(advanced.timeLimitMs);
      input.memoryLimitKb = Number(advanced.memoryLimitKb);
    }
    void onCreate(input);
  }

  return (
    <form className="soj-account-panel grid gap-5 p-5" onSubmit={submit}>
      <div className="border-b border-soj-line/55 pb-4">
        <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.create")}</p>
        <h2 className="mt-2 text-xl font-semibold text-soj-text">{t("authoring.create.heading")}</h2>
        <p className="mt-1 text-sm leading-6 text-soj-muted">{t("authoring.create.description")}</p>
      </div>

      <Input id="create-problem-title" label={t("authoring.titleLabel")} required value={title} onChange={(event) => setTitle(event.target.value)} />

      <details className="grid gap-3" open={advancedOpen} onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer text-sm font-medium text-soj-text">{t("authoring.advancedSettings")}</summary>
        <p className="mt-2 text-xs text-soj-muted">{t("authoring.advancedSettingsHint")}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 text-sm font-medium text-soj-text">
            <span>{t("authoring.difficulty")}</span>
            <Select value={advanced.difficulty} onValueChange={(value) => setAdvanced((current) => ({ ...current, difficulty: value as ProblemDifficulty }))}>
              <SelectTrigger className="w-full" aria-label={t("authoring.difficulty")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`problems.difficulty.${option}` as "problems.difficulty.easy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input id="create-problem-tags" label={t("authoring.tags")} placeholder={t("authoring.tagsPlaceholder")} value={advanced.tags} onChange={(event) => setAdvanced((current) => ({ ...current, tags: event.target.value }))} />
          <Input id="create-problem-time" label={t("authoring.timeLimit")} min="1" type="number" value={advanced.timeLimitMs} onChange={(event) => setAdvanced((current) => ({ ...current, timeLimitMs: event.target.value }))} />
          <Input id="create-problem-memory" label={t("authoring.memoryLimit")} min="1" type="number" value={advanced.memoryLimitKb} onChange={(event) => setAdvanced((current) => ({ ...current, memoryLimitKb: event.target.value }))} />
        </div>
      </details>

      <div>
        <Button type="submit" loading={busy} disabled={title.trim().length === 0}>
          {t("authoring.createProblemAction")}
        </Button>
      </div>
    </form>
  );
}
