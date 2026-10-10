import katex from "katex";
import { Fragment } from "react";
import "katex/dist/katex.min.css";

/**
 * 题面富文本：支持行内 `$...$` 与独立公式 `$$...$$` 的 LaTeX 渲染，
 * 以及题面里常见的 markdown 片段：行内代码 `` `x` `` 与 `**加粗**`。
 *
 * 阅读页与编辑预览共用 KaTeX 渲染。先切分原始公式，再转义普通文本，
 * 保留公式里的 `<` 与矩阵对齐符 `&`；未配对的 `$` 按普通文本输出。
 *
 * 只做这几种行内标记，不引入完整 markdown：OJ 题面的排版诉求到这里就够，
 * 一个通用 markdown 解析器会带进链接、图片、HTML 透传等一堆题面并不需要的面。
 *
 * 空行分段、单换行转 `<br />`，与 OJ 题面的书写习惯一致。
 */

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMath(segment: string, displayMode: boolean, errors: string[]) {
  const options = { displayMode, strict: false, output: "html" as const };
  try {
    return katex.renderToString(segment, { ...options, throwOnError: true });
  } catch (error) {
    if (!(error instanceof katex.ParseError)) throw error;
    errors.push(error.message);
    // KaTeX escapes the invalid source and tooltip; error messages below use React text.
    return katex.renderToString(segment, { ...options, throwOnError: false });
  }
}

function renderInline(block: string) {
  // 一次切分同时认行内代码、加粗、行内公式、独立公式。顺序即优先级：
  // 代码片段里的 `$` 不该被当成公式，所以代码写在最前。
  const tokens = block.split(
    /(`[^`\n]+`|\*\*[^*\n]+\*\*|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g,
  );
  let html = "";
  const errors: string[] = [];
  for (const token of tokens) {
    if (!token) continue;
    if (token.length > 2 && token.startsWith("`") && token.endsWith("`")) {
      // 行内代码：题面里 `even` / `odd` 这种字面量，等宽 + 浅底，别当普通文本读。
      html += `<code class="rounded-soj-sm border border-soj-line bg-soj-bg/60 px-1.5 py-0.5 font-mono text-[0.92em] text-soj-text">${escapeHtml(token.slice(1, -1))}</code>`;
    } else if (token.length > 4 && token.startsWith("**") && token.endsWith("**")) {
      html += `<strong class="font-semibold text-soj-text">${escapeHtml(token.slice(2, -2))}</strong>`;
    } else if (token.length > 4 && token.startsWith("$$") && token.endsWith("$$")) {
      // 独立公式允许横向滚动，避免长公式撑破阅读栏
      html += `<span class="block overflow-x-auto">${renderMath(token.slice(2, -2), true, errors)}</span>`;
    } else if (token.length > 2 && token.startsWith("$") && token.endsWith("$")) {
      html += renderMath(token.slice(1, -1), false, errors);
    } else {
      html += escapeHtml(token).replace(/\n/g, "<br />");
    }
  }
  return { html, errors };
}

export function MathText({ text, className, errorLabel }: { text: string; className?: string; errorLabel?: string }) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map(renderInline);

  return (
    <div className={className}>
      {paragraphs.map(({ html, errors }, index) => (
        <Fragment key={index}>
          <p className="leading-7 [&_.katex-display]:my-3" dangerouslySetInnerHTML={{ __html: html }} />
          {errorLabel && errors.length > 0 ? (
            <ul className="mt-2 grid gap-1 text-xs text-soj-danger" aria-live="polite">
              {errors.map((error, errorIndex) => <li key={errorIndex}>{errorLabel}: {error}</li>)}
            </ul>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
