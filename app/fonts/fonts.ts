import localFont from "next/font/local";

/**
 * 自托管字体栈。
 *
 * 为什么不用 next/font/google（Geist / Inter）：
 * 那套「几何无衬线 + 近黑底 + 荧光强调色」是当下 SaaS 模板的默认脸，
 * 页面再干净也会被读成「AI 生成」。这里换成有明确性格的三款字体，
 * 并把字体文件同步进仓库，构建期不依赖外网。
 *
 * - 展示字：Space Grotesk —— 标题、大数字、品牌字。字形里的切口与不等宽
 *   让它带一点机械感，适合「精密仪器」的气质。
 * - 正文/UI：IBM Plex Sans —— 人文主义骨架，技术产品常用，安静且不撞脸。
 * - 代码/计量：JetBrains Mono —— 等宽数字，用于判题耗时、内存、排名等需要
 *   逐位对齐的场景。
 *
 * 中文不走 Web 字体（CJK 子集体量在 5MB 以上，不划算），交给系统字体，
 * 回退链覆盖 macOS / Windows / Android。
 *
 * 注意：`fallback` 必须写成数组字面量。Turbopack 的字体加载器要静态分析这个
 * 参数，写成「展开一个变量」会直接报 `Unexpected spread` 并让整个应用 500。
 *
 * 三者均为 SIL Open Font License 1.1，见同目录 LICENSE.txt。
 */

export const displayFont = localFont({
  src: "./SpaceGrotesk-Variable.woff2",
  variable: "--font-soj-display",
  weight: "300 700",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
});

export const sansFont = localFont({
  src: "./IBMPlexSans-Variable.woff2",
  variable: "--font-soj-sans",
  weight: "100 700",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
});

export const monoFont = localFont({
  src: "./JetBrainsMono-Variable.woff2",
  variable: "--font-soj-mono",
  weight: "100 800",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "monospace"],
});
