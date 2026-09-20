"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/features/auth/auth-form";
import styles from "./join-us.module.css";

/**
 * 加入我们。
 *
 * 首页的收尾，也是整页唯一一处动作引导：看完这是什么，然后开一个账号。
 *
 * ── 为什么是一整块而不是两个按钮 ────────────────────────────────────────────
 *
 * 更早一版这里是「注册账号」（金属银）＋「登录」（描边）两个并排的小按钮。
 * 它们在说「有两条路，你自己选」——可这个页面上的读者还没有账号，
 * 把他分成「新用户 / 老用户」两拨、并排摆出两个等价选项，是把内部的状态
 * 当成了他对外的选择。现在只有一块：整行可点，点开弹窗再分注册与登录。
 *
 * ── 居中 + 全大写 ─────────────────────────────────────────────────────────
 *
 * 上一版是**左对齐**：一行「加入我们」顶到左边，箭头甩在最右边。
 * 在一个已经改成居中构图的页面上，那读起来像没收尾的排版。
 * 现在它居中对齐，箭头跟在词后面；整页只有中轴一条线，从上到下走通。
 *
 * 显示词改成全大写英文：大写的拉丁字母在高字号下才立得住
 * （小写字母在 148px 上会被 x-height 拉得软塌），而且它是这一页唯一的「动作」，
 * 用全大写把自己和上下两句陈述句区分开。文案仍在 i18n 表里，不是写死在组件里。
 *
 * ── 弹窗 ──────────────────────────────────────────────────────────────────
 *
 * 上一版弹窗是**一张原始表单**：顶部一排小小的页签，下面三行标签 + 输入框，
 * 底部一枚发光按钮，没有任何标题、说明与收尾。丑的根源有三条，都已修：
 *   1. **面板与输入框同色。** 两者都是 bg-raised(12,15,21)，输入框因此只剩一圈描边，
 *      整块读起来是「贴在墙上的表格」。现在面板取 surface(17,21,30)、输入框留在
 *      bg-raised，输入框成了压进面板里的凹槽（见 .soj-sheet）。
 *   2. **没有标题。** 打开一个弹窗，读者第一眼应该看到「我要做什么」。
 *      现在标题与一句说明居中放在最上面。
 *      **这条结论与上一版相反，而上一版在当时是对的**：那时面板顶部挂着一排页签
 *      在说「注册 / 登录」，再补一个标题就是同一句话在同一个弹窗里说两遍。
 *      页签撤掉之后，面板上再没有任何东西交代「你在做什么」——标题因此必须可见，
 *      它不再是重复，而是唯一的方向指示。
 *   3. **切换靠页签。** 页签是「同一层级的两块内容」，而注册与登录是**二选一的身份状态**——
 *      用页签表达它，等于把面板顶部切出一块来当导航。现在改成页脚一行
 *      「已有账号？登录」，这是任何一家产品最省地方的写法。
 *
 * 这一整块虽然用 `Button` 渲染，但走的是 `variant="bare"`——可点，但不长成按钮。
 * 动效：静止态是压暗的银字，指针移上去时一道亮银从左往右扫过。
 */
export function JoinUs() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"register" | "login">("register");
  const isRegister = mode === "register";

  return (
    <section className={styles.join} data-home-join aria-label={t("home.join")}>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="bare"
            size="bare"
            className="flex w-full flex-col items-center gap-3 py-16 text-center sm:py-20 lg:py-28"
          >
            {/* 收束句。它属于这一块，不属于展台：展台陈述「这是什么」，
                这里才是「所以来吧」。 */}
            <span className={styles.statement}>{t("home.statement")}</span>
            <span className={styles.invite}>
              {t("home.join.display")}
              <ArrowRight className={styles.arrow} aria-hidden />
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent className={styles.dialog}>
          <DialogTitle className="text-center font-display text-2xl">
            {isRegister ? t("auth.form.registerTitle") : t("auth.form.loginTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isRegister ? t("auth.form.registerDescription") : t("auth.form.loginDescription")}
          </DialogDescription>

          {/* key 挂 mode：切换身份时整个表单重挂载，
              上一侧填错留下的字段报错不会跟着漂到另一侧。 */}
          <div className={styles.form}>
            <AuthForm key={mode} mode={mode} chrome="bare" />
          </div>

          <p className={styles.switch}>
            {isRegister ? t("home.join.haveAccount") : t("home.join.noAccount")}
            {/* px-0 要显式给：link 变体自带 px-0，但 size 那一档的 px-3.5 排在它后面，
                twMerge 按「后者胜」处理，不给就会被撑开。 */}
            <Button type="button" variant="link" size="md" className="px-0" onClick={() => setMode(isRegister ? "login" : "register")}>
              {isRegister ? t("home.join.login") : t("home.join.register")}
            </Button>
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
