import type { Page } from "@playwright/test";

/**
 * e2e 会话注入。
 *
 * 题库与比赛内容（列表 / 详情 / 竞技场 / 榜单 / 工作台）只对已登录 actor 开放
 * （前端 SessionGate + mock/后端 401 同一套策略），所以凡是断言这些页面内容的
 * 用例都要先注入一个 mock 会话——匿名打开只会看到登录墙。
 *
 * 这里给的是一个带基础阅读/提交权限的普通用户；题目与比赛的 mock 数据是静态的
 * （行状态、报名态不随用户变化），因此任何已登录用户都满足页面契约。
 */
export async function injectSession(page: Page, options: { roles?: string[]; permissions?: string[] } = {}) {
  await page.addInitScript(
    (session) => {
      window.localStorage.setItem("soj.session", JSON.stringify(session));
    },
    {
      accessToken: "e2e-access-token",
      refreshToken: "e2e-refresh-token",
      user: {
        id: 7,
        handle: "lin-chen",
        displayName: "Lin Chen",
        roles: options.roles ?? ["user"],
        permissions:
          options.permissions ?? ["problem.read", "submission.create", "submission.read_own", "contest.join"],
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  );
}
