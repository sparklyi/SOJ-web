"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { JudgeLanguage } from "@/lib/api/types";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Translator } from "@/lib/i18n/translate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/ui/cn";

export type WorkspaceValue = {
  languageId?: number;
  sourceCode: string;
  stdin: string;
};

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
  python3: `import sys

def main() -> None:
    data = sys.stdin.read().split()
    print()

main()`,
};

/** 语法色引用 globals.css 的 --soj-code-* 变量，组件里不出现字面量颜色。 */
const sojHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.self], color: "var(--soj-code-keyword)" },
  { tag: [tags.string, tags.regexp], color: "var(--soj-code-string)" },
  { tag: [tags.comment, tags.meta], color: "var(--soj-code-comment)", fontStyle: "italic" },
  { tag: [tags.number, tags.bool], color: "var(--soj-code-number)" },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName), tags.definition(tags.propertyName)], color: "var(--soj-text)" },
]);

function languageExtension(engineLanguageId: string | undefined) {
  switch (engineLanguageId) {
    case "cpp17":
      return cpp();
    case "go":
      return go();
    case "python3":
      return python();
    default:
      return [];
  }
}

type CodeWorkspaceProps = {
  languages: JudgeLanguage[];
  initialLanguageId?: number;
  value: WorkspaceValue;
  onChange: (value: WorkspaceValue) => void;
  /** 面板底部的动作行（运行 / 提交按钮），由调用方组装。 */
  actions?: React.ReactNode;
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

/**
 * 初始代码模板：面板在挂载时用 picked 语言生成第一份源码。
 * 之后切换语言不清空已写代码（与主流 OJ 一致）。
 */
export function starterSource(language: JudgeLanguage | undefined, t: Translator) {
  if (!language) return t("problems.noEnabledJudgeLanguagesSource");
  return starters[language.engineLanguageId] ?? t("problems.languageStarterUnavailable", { language: languageLabel(language, t) });
}

/**
 * 代码工作区：一个面板装下编辑器要用的全部东西。
 *
 * 成熟 OJ（洛谷 / AtCoder）的提交页形态：语言选择贴着编辑器上沿，
 * 自定义输入常驻在编辑器下方，运行与提交是同一行里的两个动作——
 * 不用 Tab 切换（切换会藏状态），也不给每个动作重复一块标题。
 *
 * 编辑器是 CodeMirror 6：括号匹配、行号、语法高亮、方向键导航，
 * 主题色全部走设计令牌（.soj-code-editor 在 globals.css）。
 */
export function CodeWorkspace({ languages, initialLanguageId, value, onChange, actions }: CodeWorkspaceProps) {
  const { t } = useI18n();
  const initial = initialLanguageId ?? languages[0]?.id;
  const [selectedLanguageId, setSelectedLanguageId] = useState(initial ? String(initial) : "");
  const effectiveSelectedLanguageId = selectedLanguageId || (languages[0] ? String(languages[0].id) : "");
  const selectedLanguage = languages.find((item) => String(item.id) === effectiveSelectedLanguageId);
  // 语言目录可能是异步到达的：就绪且用户尚未编辑时，把模板种入受控状态。
  // 种过一次（或用户编辑过）就不再动，用户清空编辑器也不会被强行回填。
  const editedRef = useRef(false);
  const starter = selectedLanguage ? starterSource(selectedLanguage, t) : "";

  useEffect(() => {
    if (editedRef.current || !selectedLanguage || value.sourceCode !== "") return;
    onChange({ ...value, sourceCode: starter });
  }, [onChange, selectedLanguage, starter, value]);

  const extensions = useMemo(() => {
    const lang = languageExtension(selectedLanguage?.engineLanguageId);
    return lang ? [lang, syntaxHighlighting(sojHighlight)] : [syntaxHighlighting(sojHighlight)];
  }, [selectedLanguage?.engineLanguageId]);

  function update(patch: Partial<WorkspaceValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <section className="soj-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line px-4 py-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
          {t("problems.codeWorkspace")}
        </h2>
        <Select
          value={effectiveSelectedLanguageId}
          onValueChange={(next) => {
            setSelectedLanguageId(next);
            update({ languageId: Number(next) });
          }}
          disabled={languages.length === 0}
        >
          <SelectTrigger className="h-8 w-auto min-w-36 gap-1.5 px-2.5 text-xs" aria-label={t("problems.language")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.length === 0 ? (
              <SelectItem value="none" disabled>
                {t("problems.noLanguages")}
              </SelectItem>
            ) : (
              languages.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {languageLabel(item, t)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      {/* 凹陷井延续 textarea 时代的做法：编辑区是侧栏里最暗、最聚焦的一块。 */}
      <div className={cn("bg-soj-bg", languages.length === 0 && "opacity-60")}>
        <CodeMirror
          className="soj-code-editor"
          value={value.sourceCode === "" ? starter : value.sourceCode}
          height="384px"
          theme="none"
          extensions={extensions}
          editable={languages.length > 0}
          basicSetup={{ foldGutter: false, autocompletion: false, highlightSelectionMatches: false }}
          onChange={(next) => {
            editedRef.current = true;
            update({ sourceCode: next });
          }}
          aria-label={t("problems.sourceCode")}
        />
      </div>
      <div className="border-t border-soj-line px-4 py-3">
        <Textarea
          id="problem-run-stdin"
          label={t("problems.stdinLabel")}
          helperText={t("problems.stdinHint")}
          className="min-h-20 font-mono text-[13px]"
          spellCheck={false}
          value={value.stdin}
          onChange={(event) => update({ stdin: event.target.value })}
        />
      </div>
      {actions ? (
        <div className="flex items-center gap-2.5 border-t border-soj-line px-4 py-3">{actions}</div>
      ) : null}
    </section>
  );
}
