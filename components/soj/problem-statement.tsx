import type { ProblemDetail } from "@/lib/api/types";
import type { Translator } from "@/lib/i18n/translate";

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
export function ProblemStatement({ problem, t }: { problem: ProblemDetail; t: Translator }) {
  return (
    <article className="soj-panel min-w-0">
      <section className="px-5 py-5 md:px-6 md:py-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-soj-faint">
          {t("problem.statement")}
        </h2>
        {/* 面板有 780px 宽，但正文一行排到 100 个字符就不是给人读的了。
            正文单独限宽，表单类的双栏区块仍然吃满宽度。 */}
        <p className="mt-3 max-w-[72ch] leading-7 text-soj-text">{problem.statement}</p>
      </section>

      <section className="grid gap-6 border-t border-soj-line px-5 py-5 md:grid-cols-2 md:px-6 md:py-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-soj-text">{t("problem.input")}</h2>
          <p className="mt-2 text-sm leading-7 text-soj-muted">{problem.input}</p>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-soj-text">{t("problem.output")}</h2>
          <p className="mt-2 text-sm leading-7 text-soj-muted">{problem.output}</p>
        </div>
      </section>

      <section className="border-t border-soj-line px-5 py-5 md:px-6 md:py-6">
        <h2 className="text-sm font-semibold text-soj-text">{t("problems.examples")}</h2>
        <div className="mt-4 grid gap-3">
          {problem.examples.map((example, index) => (
            <figure key={`${example.input}-${index}`} className="soj-well overflow-hidden">
              <figcaption className="border-b border-soj-line bg-soj-surface/40 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                {t("problems.example", { number: index + 1 })}
              </figcaption>
              <div className="grid md:grid-cols-2">
                <div className="min-w-0 p-3 md:border-r md:border-soj-line">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                    {t("problem.input")}
                  </p>
                  <pre className="mt-2 overflow-auto font-mono text-[13px] leading-6 text-soj-text">
                    <code>{example.input}</code>
                  </pre>
                </div>
                <div className="min-w-0 border-t border-soj-line p-3 md:border-t-0">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-soj-muted">
                    {t("problem.output")}
                  </p>
                  <pre className="mt-2 overflow-auto font-mono text-[13px] leading-6 text-soj-text">
                    <code>{example.output}</code>
                  </pre>
                </div>
              </div>
            </figure>
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
