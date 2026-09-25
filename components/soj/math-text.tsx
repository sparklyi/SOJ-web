import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * 题面富文本：支持行内 `$...$` 与独立公式 `$$...$$` 的 LaTeX 渲染，
 * 以及题面里常见的 markdown 片段：行内代码 `` `x` `` 与 `**加粗**`。
 *
 * 渲染发生在服务端（katex.renderToString），页面不需要为公式加载客户端 JS。
 * 文本先做 HTML 转义再切分公式段，因此题面里的 `<`、`>`、`&` 不会被当成
 * 标签解析；`$` 配对遵循 KaTeX 惯例，未配对的 `$` 按普通文本输出。
 *
 * 只做这几种行内标记，不引入完整 markdown：OJ 题面的排版诉求到这里就够，
 * 一个通用 markdown 解析器会带进链接、图片、HTML 透传等一堆题面并不需要的面。
 *
 * 空行分段、单换行转 `<br />`，与 OJ 题面的书写习惯一致。
 */

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMath(segment: string, displayMode: boolean) {
  return katex.renderToString(segment, { displayMode, throwOnError: false, strict: false, output: "html" });
}

function renderInline(block: string) {
  // 一次切分同时认行内代码、加粗、行内公式、独立公式。顺序即优先级：
  // 代码片段里的 `$` 不该被当成公式，所以代码写在最前。
  const tokens = escapeHtml(block).split(
    /(`[^`\n]+`|\*\*[^*\n]+\*\*|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g,
  );
  let html = "";
  for (const token of tokens) {
    if (!token) continue;
    if (token.length > 2 && token.startsWith("`") && token.endsWith("`")) {
      // 行内代码：题面里 `even` / `odd` 这种字面量，等宽 + 浅底，别当普通文本读。
      html += `<code class="rounded-soj-sm border border-soj-line bg-soj-bg/60 px-1.5 py-0.5 font-mono text-[0.92em] text-soj-text">${token.slice(1, -1)}</code>`;
    } else if (token.length > 4 && token.startsWith("**") && token.endsWith("**")) {
      html += `<strong class="font-semibold text-soj-text">${token.slice(2, -2)}</strong>`;
    } else if (token.length > 4 && token.startsWith("$$") && token.endsWith("$$")) {
      // 独立公式允许横向滚动，避免长公式撑破阅读栏
      html += `<span class="block overflow-x-auto">${renderMath(token.slice(2, -2), true)}</span>`;
    } else if (token.length > 2 && token.startsWith("$") && token.endsWith("$")) {
      html += renderMath(token.slice(1, -1), false);
    } else {
      html += token.replace(/\n/g, "<br />");
    }
  }
  return html;
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="leading-7 [&_.katex-display]:my-3"
          dangerouslySetInnerHTML={{ __html: renderInline(paragraph) }}
        />
      ))}
    </div>
  );
}
