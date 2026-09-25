/**
 * 练习场文案。见 `features/playground`。
 *
 * 只留功能性词条：动作、状态、空态、错误。
 *
 * 练习场不需要向用户解释「这是什么」——页面标题和运行按钮已经说完了，
 * 多出来的每一句都是噪音。
 */
export const playgroundMessages = {
  "playground.title": { en: "Playground", "zh-CN": "练习场" },
  "playground.runAction": { en: "Run", "zh-CN": "运行" },
  "playground.running": { en: "Running...", "zh-CN": "运行中..." },
  "playground.signInToRun": { en: "Sign in to run", "zh-CN": "登录后运行" },
  "playground.signInHint": { en: "Sign in to run code and see the output.", "zh-CN": "登录后即可运行代码并查看输出。" },
  "playground.output": { en: "Output", "zh-CN": "输出" },
  "playground.outputIdle": { en: "Nothing has run yet.", "zh-CN": "还没有运行过。" },
  "playground.loadingLanguages": { en: "Loading judge languages...", "zh-CN": "正在加载评测语言..." },
  "playground.languageCatalogEmpty": {
    en: "No judge language is enabled, so there is nothing to run yet.",
    "zh-CN": "当前没有启用任何评测语言，暂时无法运行。",
  },
} as const;
