"use client";

import { useEffect, useState } from "react";
import type { JudgeLanguage } from "@/lib/api/types";

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

function languageLabel(language: JudgeLanguage) {
  if (!language.version || language.name.toLowerCase().includes(language.version.toLowerCase())) return language.name;
  return `${language.name} ${language.version}`;
}

function starterFor(language: JudgeLanguage | undefined, initialLanguageId: number | undefined, value: string) {
  if (!language) return "// No enabled judge languages are available.";
  if (value && language.id === initialLanguageId) return value;
  return starters[language.engineLanguageId] ?? (value || `// ${languageLabel(language)} starter is not configured yet.`);
}

export function CodeWorkspace({ languages, initialLanguageId, value = "", onChange }: CodeWorkspaceProps) {
  const initial = initialLanguageId ?? languages[0]?.id;
  const [selectedLanguageId, setSelectedLanguageId] = useState(initial ? String(initial) : "");
  const selectedLanguage = languages.find((item) => String(item.id) === selectedLanguageId);
  const [sourceCode, setSourceCode] = useState(() => starterFor(selectedLanguage, initial, value));

  useEffect(() => {
    onChange?.({
      languageId: selectedLanguage ? Number(selectedLanguage.id) : undefined,
      sourceCode,
    });
  }, [onChange, selectedLanguage, sourceCode]);

  return (
    <section className="overflow-hidden rounded-[18px_6px_14px_6px] border border-soj-line/58 bg-soj-bg-raised/78 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/55 px-4 py-2">
        <h2 className="text-sm font-medium text-soj-text">Code workspace</h2>
        <label className="grid gap-1">
          <span className="sr-only">Language</span>
          <select
            aria-label="Language"
            className="soj-language-select"
            disabled={languages.length === 0}
            value={selectedLanguageId}
            onChange={(event) => {
              const nextLanguageId = event.target.value;
              setSelectedLanguageId(nextLanguageId);
            }}
          >
            {languages.length === 0 ? <option value="">No languages</option> : null}
            {languages.map((item) => (
              <option key={item.id} value={item.id}>
                {languageLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        aria-label="Source code"
        className="min-h-64 w-full resize-y border-0 bg-soj-bg/24 p-4 font-mono text-sm leading-6 text-soj-muted outline-none ring-0 transition placeholder:text-soj-muted/60 focus:bg-soj-bg/32 focus:text-soj-text"
        disabled={languages.length === 0}
        spellCheck={false}
        value={sourceCode}
        onChange={(event) => setSourceCode(event.target.value)}
      />
    </section>
  );
}
