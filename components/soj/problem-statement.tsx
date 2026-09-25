"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, Copy } from "lucide-react";
import type { ProblemDetail } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/translate";
import { MathText } from "@/components/soj/math-text";

/**
 * 题面阅读区。
 *
 * 旧实现有三个具体缺陷：
 * 1. 标题用 `text-6xl`，题面变成海报，正文被压到首屏之外；
 * 2. 题目描述 / 输入 / 输出 / 示例 / 限制条件各带一层边框，读起来是五张卡片，
 *    而不是一篇连续的文章；
 * 3. 输入 / 输出用「左描边 + 两栏并排」，看起来像两段互不相干的引用。
 *
 * 现在收敛成单个面板，区块之间只用 1px 分隔线切分，视线沿一条主轴下行。
 * 标题交给页面级 PageHeader，这里从「题目描述」开始。
 *
 * 示例里的 Input / Output 用 figcaption 与 p 标注而不是 h3：
 * 它们是同一条示例的两个字段，不是两个章节；article 内因此只保留
 * 唯一的 Input / Output 标题，语义与无障碍导航都更准确。
 */
export function ProblemStatement({
  problem,
  t,
  onUseExampleInput,
}: {
  problem: ProblemDetail;
  t: Translator;
  /** 把某条示例的输入填进右侧编辑器的「自定义输入」。未提供时只显示复制。 */
  onUseExampleInput?: (text: string) => void;
}) {
  return (
    <article className="soj-panel min-w-0">
      <section className="px-5 py-5 md:px-6 md:py-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-soj-faint">
          {t("problem.statement")}
        </h2>
        {/* 面板有 780px 宽，但正文一行排到 100 个字符就不是给人读的了。
            正文单独限宽，表单类的双栏区块仍然吃满宽度。
            题面支持行内 $...$ 与独立 $$...$$ 的 LaTeX（KaTeX 服务端渲染）。 */}
        <MathText text={problem.statement} className="mt-3 max-w-[72ch] text-soj-text" />
      </section>

      <section className="grid gap-6 border-t border-soj-line px-5 py-5 md:grid-cols-2 md:px-6 md:py-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-soj-text">{t("problem.input")}</h2>
          <MathText text={problem.input} className="mt-2 text-sm text-soj-muted" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-soj-text">{t("problem.output")}</h2>
          <MathText text={problem.output} className="mt-2 text-sm text-soj-muted" />
        </div>
      </section>

      <section className="border-t border-soj-line px-5 py-5 md:px-6 md:py-6">
        <h2 className="text-sm font-semibold text-soj-text">{t("problems.examples")}</h2>
        <div className="mt-4 grid gap-3">
          {problem.examples.map((example, index) => (
            <ExampleBlock key={`${example.input}-${index}`} example={example} index={index} t={t} onUseInput={onUseExampleInput} />
          ))}
        </div>
      </section>

      {problem.constraints.length > 0 ? (
        <section className="border-t border-soj-line px-5 py-5 md:px-6 md:py-6">
          <h2 className="text-sm font-semibold text-soj-text">{t("problems.constraints")}</h2>
          <ul className="mt-3 grid gap-1.5">
            {problem.constraints.map((constraint) => (
              <li key={constraint} className="flex gap-3 font-mono text-[13px] leading-6 text-soj-muted">
                <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-soj-line-strong" />
                <span className="min-w-0">{constraint}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

/**
 * 单条示例：右上角带「填入自定义输入」与「复制输入」。
 *
 * 这两个动作是同一件事的两种去向——示例的输入要么进编辑器跑一跑，
 * 要么进剪贴板。复制失败（非安全上下文 / 权限被拒）不弹错，
 * 用户仍可手动选中：读取剪贴板失败不是页面该打断阅读的错误。
 */
function ExampleBlock({
  example,
  index,
  t,
  onUseInput,
}: {
  example: ProblemDetail["examples"][number];
  index: number;
  t: Translator;
  onUseInput?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInput() {
    try {
      await navigator.clipboard.writeText(example.input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时保持静默，见上方注释。
    }
  }

  return (
    <figure className="soj-well overflow-hidden">
      <figcaption className="flex items-center justify-between gap-3 border-b border-soj-line bg-soj-surface/40 px-3 py-1.5">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
          {t("problems.example", { number: index + 1 })}
        </span>
        <span className="flex items-center gap-1">
          {onUseInput ? (
            <button
              type="button"
              onClick={() => onUseInput(example.input)}
              aria-label={t("problems.useAsInput")}
              title={t("problems.useAsInput")}
              className="grid h-6 w-6 place-items-center rounded-soj-sm text-soj-muted transition hover:bg-soj-surface-2 hover:text-soj-text"
            >
              <ArrowDownToLine aria-hidden className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void copyInput()}
            aria-label={copied ? t("problems.copied") : t("problems.copyInput")}
            title={copied ? t("problems.copied") : t("problems.copyInput")}
            className="grid h-6 w-6 place-items-center rounded-soj-sm text-soj-muted transition hover:bg-soj-surface-2 hover:text-soj-text"
          >
            {copied ? <Check aria-hidden className="h-3.5 w-3.5 text-soj-success" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
          </button>
        </span>
      </figcaption>
      <div className="grid md:grid-cols-2">
        <div className="min-w-0 p-3 md:border-r md:border-soj-line">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">{t("problem.input")}</p>
          <pre className="mt-2 overflow-auto font-mono text-[13px] leading-6 text-soj-text">
            <code>{example.input}</code>
          </pre>
        </div>
        <div className="min-w-0 border-t border-soj-line p-3 md:border-t-0">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">{t("problem.output")}</p>
          <pre className="mt-2 overflow-auto font-mono text-[13px] leading-6 text-soj-text">
            <code>{example.output}</code>
          </pre>
        </div>
      </div>
    </figure>
  );
}
