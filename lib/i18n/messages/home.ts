import type { MessageCatalog } from "../types";

/**
 * 首页文案。
 *
 * 首页是展台，所以这里的键按**陈列层次**组织，而不是按功能模块组织：
 *   展台（这是什么）→ 铭牌（有多大）→ 加入我们（怎么进来）
 *
 * 有一条取舍贯穿全表：**不写解释性文字**。
 * 凡是「教你判题是怎么跑的」「告诉你三步就能开始」这种句子，一律不进这张表——
 * 那不是文案问题，是把读者当外行。展台上的字只有三种：名字、数字、名词。
 *
 * 凡是与其它页面共用的词条（如 `home.statement` / `home.exploreProblems`）留在 system.ts，
 * 不要在这里再抄一份，否则同一个词会出现两种译法。
 */
export const homeMessages = {
  // 品牌锁定式的后半段：站名旁边的品类词。名字 + 品类是任何一家公司最标准的写法，
  // 它一句话回答「这是什么站」，读者不需要滚动就能知道。
  "home.plinth.category": { en: "Online judge", "zh-CN": "在线测评平台" },

  // 这里曾有 `home.plinth.markCjk`（中文名「日晷」），2026-09-23 已撤回，原因是被测出来的：
  // 拉丁字标的大写高度只占 0.70em，而汉字方块几乎占满 em（约 0.88em），**同一 font-size 下
  // 汉字视觉高度大 25%**。两段并排读成「两个字标硬拼一行」，而不是「一个名字」。
  // 中文译名没有丢，它仍在 `meta.title` / 页脚版权行 / 各页正文里出现，
  // 只是不再进界面字标。详见 docs/design-system/soj-visual-language.md 的锁定式条款。

  // 定位句。锁定式已经把「这是什么」说完了，这句只补「给谁用」。
  // 不写「分层题库、逐测试点判题」这类机制说明——机制是产品常识，不是卖点。
  "home.plinth.lead": {
    en: "For practising algorithms and competing.",
    "zh-CN": "面向算法练习与竞赛。",
  },

  // 铭牌。三个站级数字回答三个具体问题：有多少题、站活不活、我的语言支持吗。
  // 它们都是**全站尺度**的聚合，不是「某个人的提交数」——后者没人关心。
  // 「比赛场次」曾在这一排，已撤掉：它是运营流水，不是体量。
  "home.facts.problems": { en: "Problems", "zh-CN": "题目" },
  "home.facts.submissions": { en: "Submissions", "zh-CN": "提交" },
  "home.facts.languages": { en: "Languages", "zh-CN": "支持语言" },

  // 加入我们。首页只负责**邀请**，具体是注册还是登录，进到弹窗里再问。
  // `home.join` 是这一块的无障碍名（它同时是弹窗外壳的语义标签）。
  "home.join": { en: "Join us", "zh-CN": "加入我们" },

  // 显示词。这一条两个语种**故意写成同一个值**：它是排版意义上的锁定式，
  // 不是一句要翻译的话——大写的拉丁字母在高字号下才立得住，中文放大会散。
  // 它仍然是本表的一员，未来若要换文案不必进组件里翻。
  "home.join.display": { en: "JOIN US", "zh-CN": "JOIN US" },

  // 弹窗页脚的身份切换。注册与登录是**二选一的身份状态**，用一行文字切换最省地方
  // （页签是「同层级的两块内容」，用来表达身份状态会在面板顶部切出一块假导航）。
  "home.join.haveAccount": { en: "Already have an account?", "zh-CN": "已有账号？" },
  "home.join.noAccount": { en: "No account yet?", "zh-CN": "还没有账号？" },
  "home.join.register": { en: "Register", "zh-CN": "注册" },
  "home.join.login": { en: "Login", "zh-CN": "登录" },
} satisfies MessageCatalog;
