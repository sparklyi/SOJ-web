/**
 * self-run 的运行期文案。题目页与练习场共用（见 `features/runs`）。
 *
 * 这里只放「运行」这件事本身新增的词条。verdict 名称（`status.*`）、
 * 语言目录、编辑器、stdin 等词条已经在 `problems.*` 里，且被共享组件
 * （`components/soj/code-workspace.tsx`）使用，不在这里重复一份。
 */
export const runMessages = {
  "runs.finished": { en: "Finished", "zh-CN": "运行完成" },
  "runs.stillRunningElapsed": { en: "still running ({elapsed})", "zh-CN": "仍在运行（已 {elapsed}）" },
  "runs.stillRunningHint": {
    en: "This run has not finished within the wait window. It may still be executing on the judge; ask again to check.",
    "zh-CN": "这次运行在等待窗口内没有结束。判题端可能仍在执行，可以再查一次。",
  },
  "runs.continuePolling": { en: "Check again", "zh-CN": "继续查询" },
} as const;
