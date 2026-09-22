/**
 * 练习场文案。见 `features/playground`。
 *
 * 与 `problems.*` 里的运行词条不重复：语言目录、编辑器、stdin、verdict
 * 名称那些已经被共享组件用着（`components/soj/code-workspace.tsx`、
 * `features/runs`），这里只放练习场自己的话。
 */
export const playgroundMessages = {
  "playground.eyebrow": { en: "Scratchpad", "zh-CN": "随手写" },
  "playground.title": { en: "Playground", "zh-CN": "练习场" },
  "playground.description": {
    en: "Write code, feed it input, run it. No problem attached and nothing is judged — this is a scratchpad, not a submission.",
    "zh-CN": "写代码、给它输入、直接运行。不绑定题目，也不判题——这是随手练的地方，不是提交。",
  },
  "playground.runAction": { en: "Run", "zh-CN": "运行" },
  "playground.running": { en: "Running...", "zh-CN": "运行中..." },
  "playground.signInToRun": { en: "Sign in to run", "zh-CN": "登录后运行" },
  "playground.signInHint": { en: "to run code. Your draft is kept in this browser either way.", "zh-CN": "后即可运行。草稿无论是否登录都会留在本浏览器里。" },
  "playground.output": { en: "Output", "zh-CN": "运行输出" },
  "playground.outputIdle": {
    en: "Nothing has run yet. Press Run to execute the code with the input below the editor.",
    "zh-CN": "还没有运行过。点「运行」，程序会用编辑器下方的输入执行一次。",
  },
  "playground.draftHint": {
    en: "Drafts are saved in this browser per language. They are not synced to your account.",
    "zh-CN": "草稿按语言保存在本浏览器里，不会同步到账号。",
  },
  "playground.loadingLanguages": { en: "Loading judge languages...", "zh-CN": "正在加载评测语言..." },
  "playground.languageCatalogEmpty": {
    en: "No judge language is enabled, so there is nothing to run yet.",
    "zh-CN": "当前没有启用任何评测语言，暂时无法运行。",
  },
} as const;
