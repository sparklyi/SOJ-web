import type { MessageCatalog } from "../types";

export const coreMessages = {
  "meta.title": { en: "SOJ", "zh-CN": "SOJ" },
  "meta.description": {
    en: "Online judge for practice, contests, submissions, and live scoreboards.",
    "zh-CN": "面向练习、竞赛、提交与实时榜单的在线评测系统。",
  },
  "nav.home": { en: "Home", "zh-CN": "首页" },
  "nav.problems": { en: "Problems", "zh-CN": "题目" },
  "nav.contests": { en: "Contests", "zh-CN": "比赛" },
  "nav.author": { en: "Author", "zh-CN": "出题" },
  "nav.brandTagline": { en: "Online Judge", "zh-CN": "在线评测" },
  "nav.primary": { en: "Primary navigation", "zh-CN": "主导航" },
  "nav.account.openAuthenticated": {
    en: "Open account menu for {name}",
    "zh-CN": "打开 {name} 的账户菜单",
  },
  "nav.account.me": { en: "Me", "zh-CN": "我的账户" },
  "nav.account.submissions": { en: "My submissions", "zh-CN": "我的提交" },
  "nav.account.settings": { en: "Settings", "zh-CN": "设置" },
  "nav.account.authorProblems": { en: "Author problems", "zh-CN": "管理题目" },
  "nav.account.login": { en: "Login", "zh-CN": "登录" },
  "nav.account.register": { en: "Register", "zh-CN": "注册" },
  "nav.account.logout": { en: "Logout", "zh-CN": "退出登录" },
  "language.label": { en: "Language", "zh-CN": "语言" },
  "language.switcher": { en: "Switch language", "zh-CN": "切换语言" },
  "language.english": { en: "English", "zh-CN": "英文" },
  "language.simplifiedChinese": { en: "Simplified Chinese", "zh-CN": "简体中文" },
  "common.loading": { en: "Loading", "zh-CN": "加载中" },
  "common.refresh": { en: "Refresh", "zh-CN": "刷新" },
  "common.submit": { en: "Submit", "zh-CN": "提交" },
  "common.preview": { en: "Preview", "zh-CN": "预览" },
  "common.cancel": { en: "Cancel", "zh-CN": "取消" },
  "common.delete": { en: "Delete", "zh-CN": "删除" },
  "common.save": { en: "Save", "zh-CN": "保存" },
  "common.open": { en: "Open", "zh-CN": "打开" },
  "common.close": { en: "Close", "zh-CN": "关闭" },
  "common.noData": { en: "No data available.", "zh-CN": "暂无数据。" },
  "common.notFound": { en: "Not found", "zh-CN": "未找到" },
  "common.loadError": { en: "This content could not be loaded. Please try again later.", "zh-CN": "内容加载失败，请稍后重试。" },

  // 站点页脚。三样东西都指向真实存在的地方，见 components/layout/site-footer.tsx。
  // `footer.label` 是这个地标的无障碍名：没有名字的 contentinfo 在地标列表里读不出来。
  "footer.label": { en: "Site footer", "zh-CN": "站点页脚" },
  "footer.copyright": {
    en: "© {year} SOJ. All rights reserved.",
    "zh-CN": "© {year} SOJ 版权所有",
  },
  "footer.source": { en: "Source code", "zh-CN": "开源仓库" },
  "footer.issues": { en: "Issues", "zh-CN": "问题反馈" },
} satisfies MessageCatalog;
