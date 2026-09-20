import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * 题面富文本：支持行内 `$...$` 与独立公式 `$$...$$` 的 LaTeX 渲染。
 *
 * 渲染发生在服务端（katex.renderToString），页面不需要为公式加载客户端 JS。
 * 文本先做 HTML 转义再切分公式段，因此题面里的 `<`、`>`、`&` 不会被当成
 * 标签解析；`$` 配对遵循 KaTeX 惯例，未配对的 `$` 按普通文本输出。
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
  const tokens = escapeHtml(block).split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  let html = "";
  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith("$$") && token.endsWith("$$") && token.length > 4) {
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
