import type { MessageCatalog } from "../types";

export const authMessages = {
  "auth.login.eyebrow": { en: "Account access", "zh-CN": "账户访问" },
  "auth.login.title": { en: "Login", "zh-CN": "登录" },
  "auth.login.description": {
    en: "Enter Sundial for contests, problems, and submissions.",
    "zh-CN": "进入 Sundial，参与比赛、练习题目并查看提交记录。",
  },
  "auth.login.meta": { en: "Session", "zh-CN": "会话" },

  "auth.register.eyebrow": { en: "Create account", "zh-CN": "创建账户" },
  "auth.register.title": { en: "Register", "zh-CN": "注册" },
  "auth.register.description": {
    en: "Create a Sundial account for the contest workspace.",
    "zh-CN": "创建 Sundial 账户，进入比赛工作区。",
  },
  "auth.register.meta": { en: "Onboarding", "zh-CN": "入门" },

  "auth.form.loginTitle": { en: "Login", "zh-CN": "登录" },
  "auth.form.registerTitle": { en: "Create account", "zh-CN": "创建账户" },
  "auth.form.loginDescription": {
    en: "Use your Sundial account to continue.",
    "zh-CN": "使用 Sundial 账户继续。",
  },
  "auth.form.registerDescription": {
    en: "Create your Sundial identity for problems and contests.",
    "zh-CN": "创建你的 Sundial 身份，用于题目和比赛。",
  },
  "auth.form.email": { en: "Email", "zh-CN": "邮箱" },
  "auth.form.username": { en: "Username", "zh-CN": "用户名" },
  "auth.form.password": { en: "Password", "zh-CN": "密码" },
  "auth.form.createAccount": { en: "Create account", "zh-CN": "创建账户" },
  "auth.form.login": { en: "Login", "zh-CN": "登录" },
  /**
   * 登录与注册的互相切换。
   *
   * 它必须是**表单页脚**的一行字，而不是旁边另一张卡片里的一个链接：
   * 切换说的是「我点错了，换一个表单」，它属于表单本身。
   * 之前登录页把「创建账户」放在右侧一张解释性卡片的末尾，
   * 注册页把「返回登录」放在同一位置——入口跑出了它该在的地方。
   */
  "auth.form.loginFooter": { en: "No account yet?", "zh-CN": "还没有账户？" },
  "auth.form.registerFooter": { en: "Already have an account?", "zh-CN": "已经有账户？" },
  "auth.validation.emailRequired": { en: "Email is required.", "zh-CN": "请输入邮箱。" },
  "auth.validation.emailInvalid": {
    en: "Enter a valid email address.",
    "zh-CN": "请输入有效的邮箱地址。",
  },
  "auth.validation.usernameRequired": { en: "Username is required.", "zh-CN": "请输入用户名。" },
  "auth.validation.passwordRequired": { en: "Password is required.", "zh-CN": "请输入密码。" },
  "auth.validation.passwordMin": {
    en: "Password must be at least 8 characters.",
    "zh-CN": "密码至少需要 8 个字符。",
  },
  "auth.error.authenticationFailed": { en: "Authentication failed.", "zh-CN": "认证失败。" },

  "auth.me.eyebrow": { en: "Account", "zh-CN": "账户" },
  "auth.me.title": { en: "Me", "zh-CN": "我的账户" },
  "auth.me.description": {
    en: "Account state, problem progress, and recent Sundial activity.",
    "zh-CN": "账户状态、题目进度与最近的 Sundial 活动。",
  },
  "auth.me.guest": { en: "Guest", "zh-CN": "访客" },
  "auth.me.guestRole": { en: "guest", "zh-CN": "guest" },
  "auth.me.loading": { en: "Loading", "zh-CN": "加载中" },
  "auth.me.currentUser": { en: "Current user", "zh-CN": "当前用户" },
  "auth.me.signedIn": { en: "Signed in", "zh-CN": "已登录" },
  "auth.me.locked": { en: "Locked", "zh-CN": "锁定" },
  "auth.me.role": { en: "Role", "zh-CN": "角色" },
  "auth.me.progress": { en: "Progress", "zh-CN": "练习进度" },
  "auth.me.progressSummary": { en: "Problem progress", "zh-CN": "题目进度" },
  "auth.me.openProblemSet": { en: "Browse problems", "zh-CN": "查看题目集" },
  "auth.me.progressEmptyTitle": { en: "No practice records yet", "zh-CN": "还没有练习记录" },
  "auth.me.progressEmptyDescription": {
    en: "Problems you attempt or solve are listed here by status.",
    "zh-CN": "做过的题目会按状态出现在这里。",
  },
  "auth.me.progressFailed": { en: "Could not load your progress.", "zh-CN": "无法加载练习进度。" },

  "auth.settings.eyebrow": { en: "Preferences", "zh-CN": "偏好" },
  "auth.settings.title": { en: "Settings", "zh-CN": "设置" },
  "auth.settings.description": {
    en: "Account preferences and local workspace defaults.",
    "zh-CN": "账户偏好与本地工作区默认项。",
  },
  "auth.settings.guest": { en: "Guest", "zh-CN": "访客" },
  "auth.settings.workspace": { en: "Workspace", "zh-CN": "工作区" },
  "auth.settings.loading": { en: "Loading", "zh-CN": "加载中" },
  "auth.settings.synced": { en: "Synced", "zh-CN": "已同步" },
  "auth.settings.signedIn": { en: "Signed in", "zh-CN": "已登录" },
  "auth.settings.locked": { en: "Locked", "zh-CN": "锁定" },
  "auth.settings.profile": { en: "Profile", "zh-CN": "资料" },
  "auth.settings.handle": { en: "Handle", "zh-CN": "用户名" },
  "auth.settings.displayName": { en: "Display name", "zh-CN": "显示名称" },
  "auth.settings.readOnly": {
    en: "Read from your account. Editing arrives with the profile pass.",
    "zh-CN": "来自账户信息，编辑能力随账户设置一并开放。",
  },
  "auth.settings.preferences": { en: "Preferences", "zh-CN": "偏好设置" },
  "auth.settings.preferencesEmptyTitle": { en: "Preferences are not open yet", "zh-CN": "偏好设置尚未开放" },
  "auth.settings.preferencesEmptyDescription": {
    en: "Theme, language, and workspace defaults will appear here once they become editable.",
    "zh-CN": "主题、语言与工作区默认项可编辑后会出现在这里。",
  },
} satisfies MessageCatalog;
