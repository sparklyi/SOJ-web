"use client";

import { useEffect, useState } from "react";
import type { JudgeLanguage } from "@/lib/api/types";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Translator } from "@/lib/i18n/translate";

const starters: Record<string, string> = {
  cpp17: `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  return 0;
}`,
  go: `package main

import (
  "bufio"
  "fmt"
  "os"
)

func main() {
  in := bufio.NewReader(os.Stdin)
  _ = in
  fmt.Println()
}`,
};

type CodeWorkspaceProps = {
  languages: JudgeLanguage[];
  initialLanguageId?: number;
  value?: string;
  onChange?: (state: { languageId?: number; sourceCode: string }) => void;
};

function languageLabel(language: JudgeLanguage, t: Translator) {
  const languageKey =
    language.engineLanguageId === "cpp17"
      ? "problems.language.cpp17"
      : language.engineLanguageId === "go"
        ? "problems.language.go"
        : language.engineLanguageId === "python3"
          ? "problems.language.python3"
          : null;
  const name = languageKey ? t(languageKey) : language.name;
  if (!language.version || name.toLowerCase().includes(language.version.toLowerCase())) return name;
  return `${name} ${language.version}`;
}

function starterFor(language: JudgeLanguage | undefined, initialLanguageId: number | undefined, value: string, t: Translator) {
  if (!language) return t("problems.noEnabledJudgeLanguagesSource");
  if (value && language.id === initialLanguageId) return value;
  return starters[language.engineLanguageId] ?? (value || t("problems.languageStarterUnavailable", { language: languageLabel(language, t) }));
}

export function CodeWorkspace({ languages, initialLanguageId, value = "", onChange }: CodeWorkspaceProps) {
  const { t } = useI18n();
  const initial = initialLanguageId ?? languages[0]?.id;
  const [selectedLanguageId, setSelectedLanguageId] = useState(initial ? String(initial) : "");
  const effectiveSelectedLanguageId = selectedLanguageId || (languages[0] ? String(languages[0].id) : "");
  const selectedLanguage = languages.find((item) => String(item.id) === effectiveSelectedLanguageId);
  const noLanguageSource = t("problems.noEnabledJudgeLanguagesSource");
  const [sourceCode, setSourceCode] = useState(() => starterFor(selectedLanguage, initial, value, t));
  const effectiveSourceCode = sourceCode === noLanguageSource && selectedLanguage ? starterFor(selectedLanguage, initialLanguageId, value, t) : sourceCode;

  useEffect(() => {
    onChange?.({
      languageId: selectedLanguage ? Number(selectedLanguage.id) : undefined,
      sourceCode: effectiveSourceCode,
    });
  }, [effectiveSourceCode, onChange, selectedLanguage]);

  return (
    <section className="soj-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line px-4 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-soj-muted">
          {t("problems.codeWorkspace")}
        </h2>
        <label className="grid gap-1">
          <span className="sr-only">{t("problems.language")}</span>
          <select
            aria-label={t("problems.language")}
            className="soj-language-select"
            disabled={languages.length === 0}
            value={effectiveSelectedLanguageId}
            onChange={(event) => {
              const nextLanguageId = event.target.value;
              setSelectedLanguageId(nextLanguageId);
            }}
          >
            {languages.length === 0 ? <option value="">{t("problems.noLanguages")}</option> : null}
            {languages.map((item) => (
              <option key={item.id} value={item.id}>
                {languageLabel(item, t)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* 编辑区用页面底色做出「凹陷井」，让代码区成为侧栏里最暗、最聚焦的一块。 */}
      <textarea
        aria-label={t("problems.sourceCode")}
        className="min-h-64 w-full resize-y border-0 bg-soj-bg p-4 font-mono text-[13px] leading-6 text-soj-text outline-none ring-0 placeholder:text-soj-faint focus:bg-soj-surface/60"
        disabled={languages.length === 0}
        spellCheck={false}
        value={effectiveSourceCode}
        onChange={(event) => setSourceCode(event.target.value)}
      />
    </section>
  );
}
