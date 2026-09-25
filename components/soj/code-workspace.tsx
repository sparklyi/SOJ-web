"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { JudgeLanguage } from "@/lib/api/types";
import { useI18n } from "@/components/providers/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
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
  c: `#include <stdio.h>

int main(void) {
  int x;
  while (scanf("%d", &x) == 1) {
    // TODO: compute and print the answer
  }
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
  java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.StringTokenizer;

public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    PrintWriter out = new PrintWriter(System.out);
    StringTokenizer tokens = new StringTokenizer(in.readLine());

    out.println();
    out.flush();
  }
}`,
  nodejs: `const input = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);

// TODO: compute and print the answer
console.log();`,
  python3: `import sys

def main() -> None:
    data = sys.stdin.read().split()
    print()

main()`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let _numbers: Vec<i64> = input
        .split_whitespace()
        .filter_map(|value| value.parse().ok())
        .collect();

    println!();
}`,
};

/** 语法色引用 globals.css 的 --soj-code-* 变量，组件里不出现字面量颜色。 */
const sojHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.self], color: "var(--soj-code-keyword)" },
  { tag: [tags.string, tags.regexp], color: "var(--soj-code-string)" },
  { tag: [tags.comment, tags.meta], color: "var(--soj-code-comment)", fontStyle: "italic" },
  { tag: [tags.number, tags.bool], color: "var(--soj-code-number)" },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName), tags.definition(tags.propertyName)], color: "var(--soj-text)" },
]);

// The label for a language the interface knows by name; anything else falls back
// to the name the API returns, so a language added on the backend is usable
// before its translation exists.
const languageLabelKeys: Record<string, MessageKey> = {
  c: "problems.language.c",
  cpp17: "problems.language.cpp17",
  go: "problems.language.go",
  java: "problems.language.java",
  nodejs: "problems.language.nodejs",
  python3: "problems.language.python3",
  rust: "problems.language.rust",
};

function languageExtension(engineLanguageId: string | undefined) {
  switch (engineLanguageId) {
    case "c":
      // The C++ grammar covers C.
      return cpp();
    case "cpp17":
      return cpp();
    case "go":
      return go();
    case "java":
      return java();
    case "nodejs":
      return javascript();
    case "python3":
      return python();
    case "rust":
      return rust();
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
  /**
   * 编辑器高度。默认 384px 是提交页的比例；练习场只有一个动作、
   * 下方也没有题面要抢位置，所以给得更大。
   */
  editorHeight?: string;
  /**
   * 撑满父容器高度（练习场用）。
   * 打开后编辑器不再是固定高度，而是吃掉面板剩下的全部空间——
   * 固定高度配一个撑满高度的右列，两者一旦对不上就会在页面里留一大块空白。
   * 此时忽略 `editorHeight`。
   */
  fill?: boolean;
  /**
   * 是否在本面板底部渲染 stdin 输入框。默认渲染（提交页要它）。
   * 练习场把输入挪到了右列，自己渲染 `StdinField`。
   */
  showStdin?: boolean;
};

/**
 * stdin 输入框。抽出来是因为练习场要把它放到右列——
 * 两个地方必须长得一模一样（同一个标签、同一份说明、同一套等宽字体），
 * 否则「输入」在两个页面上会是两种东西。
 */
export function StdinField({
  value,
  onChange,
  className,
  showHint = true,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** 窄列里放不下那行说明时关掉。 */
  showHint?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Textarea
      id="problem-run-stdin"
      label={t("problems.stdinLabel")}
      helperText={showHint ? t("problems.stdinHint") : undefined}
      className={cn("font-mono text-[13px]", className)}
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function languageLabel(language: JudgeLanguage, t: Translator) {
  const languageKey = languageLabelKeys[language.engineLanguageId];
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
 *
 * 判据是「源码等于**任一**语言的模板」，而不是「等于组件上一份种下的模板」：
 * 练习场刷新后源码是从 localStorage 草稿恢复的，它可能正是当初种下的模板，
 * 但这条恢复路径不经过种模板逻辑，组件手里没有「上一份模板」可认。只认一份的话，
 * 用户一个字没写、换个语言，代码却纹丝不动。
 */
export function isPristineSource(sourceCode: string, starterSources: ReadonlySet<string>, everSeeded: boolean): boolean {
  return starterSources.has(sourceCode) || (!everSeeded && sourceCode === "");
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
export function CodeWorkspace({
  languages,
  initialLanguageId,
  value,
  onChange,
  actions,
  editorHeight = "384px",
  fill = false,
  showStdin = true,
}: CodeWorkspaceProps) {
  const { t } = useI18n();
  const initial = initialLanguageId ?? languages[0]?.id;
  const [selectedLanguageId, setSelectedLanguageId] = useState(initial ? String(initial) : "");
  const effectiveSelectedLanguageId = selectedLanguageId || (languages[0] ? String(languages[0].id) : "");
  const selectedLanguage = languages.find((item) => String(item.id) === effectiveSelectedLanguageId);
  // 语言目录可能是异步到达的，模板要等选型就绪才能种入受控状态。
  //
  // 「还没动过」的判据不是「用户碰没碰过编辑器」，而是**源码此刻是不是某个语言的模板**：
  //   · 空串且从未种入 —— 目录未就绪的初始态，种入；
  //   · 源码恰好等于任一语言的模板 —— 用户没写一个字就换了语言，换成新语言的模板
  //     （这正是成熟 OJ 的行为：C++ 空壳切到 Python 就给 Python 壳）。认「任一语言」
  //     而不是「上一份」是因为练习场的源码可能来自恢复的草稿，组件没亲手种过它；
  //   · 源码是别的内容 —— 用户写过的代码，一个字符都不动，换语言也不清空；
  //   · 源码是用户亲手清空的空串 —— 尊重清空，不强行回填。
  const everSeededRef = useRef(false);
  const starter = selectedLanguage ? starterSource(selectedLanguage, t) : "";
  const starterSources = useMemo(
    () => new Set(languages.map((language) => starterSource(language, t))),
    [languages, t],
  );

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
    if (!isPristineSource(value.sourceCode, starterSources, everSeededRef.current)) return;
    if (value.sourceCode === starter) return;
    everSeededRef.current = true;
    onChange({ ...value, sourceCode: starter });
  }, [onChange, selectedLanguage, starter, starterSources, value]);

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
    <section className={cn("soj-panel overflow-hidden", fill && "flex h-full min-h-0 flex-col")}>
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
      <div className={cn("bg-soj-bg", fill && "min-h-0 flex-1", languages.length === 0 && "opacity-60")}>
        <CodeMirror
          className={cn("soj-code-editor", fill && "soj-code-editor-fill")}
          // 模板由种入 effect 写进受控状态后随 props 回流，渲染层只信 value——
          // 渲染期读 ref 被 react-hooks 禁止，而且显示与状态一旦分叉，
          // 「用户清空」就会被模板顶回来。
          value={value.sourceCode}
          height={fill ? "100%" : editorHeight}
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
      {showStdin ? (
        <div className="border-t border-soj-line px-4 py-3">
          <StdinField value={value.stdin} onChange={(stdin) => update({ stdin })} className="min-h-20" />
        </div>
      ) : null}
      {actions ? (
        <div className="flex items-center gap-2.5 border-t border-soj-line px-4 py-3">{actions}</div>
      ) : null}
    </section>
  );
}
