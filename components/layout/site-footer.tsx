import { getServerTranslator } from "@/lib/i18n/server";

/**
 * 站点页脚。
 *
 * 挂在**根布局**上，而不是各个页面里——「所有页面都有页脚」这件事只有一个可靠写法：
 * 让页面没有地方可以漏掉它。上一版把环境层写进首屏组件，结果只有首页有环境；
 * 页脚走同一条路会得到同一个结果。
 *
 * ── 它只放真实存在的东西 ──────────────────────────────────────────────────
 *
 * 首页曾经有一条规则叫「这一页没有页脚」，理由不是「页脚不好」，
 * 而是当时的候选内容全是**假入口**：文档、状态、关于——这些页面并不存在，
 * 编几个链接出去就是让读者点了发现是死路。
 *
 * 所以这条规则正确的写法是**不放没有落处的链接**，而不是「不要页脚」。现在放的三样
 * （版权 / 开源仓库 / 问题反馈）都有真实落点，页脚就成立了。
 * 反过来说：**不要往这里加「关于我们」「服务条款」「友情链接」**——
 * 只要它背后没有页面，就是又在编假入口。
 *
 * 本站没有 LICENSE 文件，所以这里**不写许可协议**。开源协议是一句需要文件背书的话，
 * 没有那个文件却写「MIT 许可」是编的；等真的加了 LICENSE，再把那一行加回来。
 *
 * 它同时是 `<footer>`，因此会进入无障碍树、映射为 contentinfo——
 * 这也是它必须带 aria-label 的原因：一个无名的地标在屏幕阅读器的地标列表里读不出来。
 */
export async function SiteFooter() {
  const t = await getServerTranslator();
  const year = new Date().getFullYear();

  const repository = "https://github.com/sparklyi/SOJ-web";
  const linkClass =
    "text-xs text-soj-muted underline-offset-4 transition hover:text-soj-text hover:underline focus-visible:text-soj-text focus-visible:underline";

  return (
    <footer
      className="relative mt-16 border-t border-soj-line/60"
      aria-label={t("footer.label")}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-xs text-soj-muted">{t("footer.copyright", { year })}</p>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <li>
            <a className={linkClass} href={repository} rel="noreferrer" target="_blank">
              {t("footer.source")}
            </a>
          </li>
          <li>
            <a
              className={linkClass}
              href={`${repository}/issues`}
              rel="noreferrer"
              target="_blank"
            >
              {t("footer.issues")}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
