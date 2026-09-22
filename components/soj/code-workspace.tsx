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
 * 换语言时源码是不是「还没动过的模板」。导出纯函数是为了把这条判据测死：
 * 用户没写一个字就换语言 → 换成新语言的模板；写过或亲手清空过 → 一个字符都不动。
 */
export function isPristineSource(sourceCode: string, lastStarter: string, everSeeded: boolean): boolean {
  return sourceCode === lastStarter || (!everSeeded && sourceCode === "");
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
  // 语言目录可能是异步到达的，模板要等选型就绪才能种入受控状态。
  //
  // 「还没动过」的判据不是「用户碰没碰过编辑器」，而是**源码此刻是不是上一份模板**：
  //   · 空串且从未种入 —— 目录未就绪的初始态，种入；
  //   · 源码恰好等于上一份选型对应的模板 —— 用户没写一个字就换了语言，
  //     换成新语言的模板（这正是成熟 OJ 的行为：C++ 空壳切到 Go 就给 Go 壳）；
  //   · 源码是别的内容 —— 用户写过的代码，一个字符都不动，换语言也不清空；
  //   · 源码是用户亲手清空的空串 —— 尊重清空，不强行回填。
  const lastStarterRef = useRef("");
  const everSeededRef = useRef(false);
  const starter = selectedLanguage ? starterSource(selectedLanguage, t) : "";

  // 「用户最后一次亲手产生的工作区值」。
  //
  // 受控组件的 props 会落后于状态：种模板的 effect 属于更早的那次提交，它闭包里的
  // `value.sourceCode` 还是空串。用户若在 effect 落地之前敲了字，effect 拿这份落后
  // 的值去问「源码是不是模板」会得到「是」，于是把刚敲的那几行覆盖回模板——用户看到
  // 自己打的字凭空消失。这里记下用户刚产生的值，effect 发现自己看到的不是它时就
  // 不动手，等下一次提交带着新值再来判断。
  //
  // 这是给竞态打的补丁，没有消除竞态本身：只要模板还由 effect 向上写回，就总有
  // 「effect 看到的不是用户看到的那一帧」的窗口。根治办法是把种模板交给拥有状态的
  // 父组件（数据只向下流），见 https://github.com/sparklyi/SOJ-web/issues/47。
  const latestInputRef = useRef<WorkspaceValue | null>(null);

  useEffect(() => {
    if (!selectedLanguage || starter === "") return;
    const input = latestInputRef.current;
    if (input && input.sourceCode !== value.sourceCode) return;
    if (!isPristineSource(value.sourceCode, lastStarterRef.current, everSeededRef.current)) return;
    if (value.sourceCode === starter) return;
    everSeededRef.current = true;
    lastStarterRef.current = starter;
    onChange({ ...value, sourceCode: starter });
  }, [onChange, selectedLanguage, starter, value]);

  const extensions = useMemo(() => {
    const lang = languageExtension(selectedLanguage?.engineLanguageId);
    return lang ? [lang, syntaxHighlighting(sojHighlight)] : [syntaxHighlighting(sojHighlight)];
  }, [selectedLanguage?.engineLanguageId]);

  function update(patch: Partial<WorkspaceValue>) {
    const next = { ...value, ...patch };
    latestInputRef.current = next;
    onChange(next);
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
          // 模板由种入 effect 写进受控状态后随 props 回流，渲染层只信 value——
          // 渲染期读 ref 被 react-hooks 禁止，而且显示与状态一旦分叉，
          // 「用户清空」就会被模板顶回来。
          value={value.sourceCode}
          height="384px"
          theme="none"
          extensions={extensions}
          editable={languages.length > 0}
          basicSetup={{ foldGutter: false, autocompletion: false, highlightSelectionMatches: false }}
          onChange={(next) => {
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
