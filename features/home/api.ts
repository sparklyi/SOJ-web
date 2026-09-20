import { createApiClient } from "@/lib/api/client";
import type { ApiClient, ProblemSummary } from "@/lib/api/types";
import { listProblems } from "@/features/problems/api";

/**
 * 首页的数据整形层。
 *
 * 首页是「展台」，所以它需要的不是「某一批记录」，而是**关于这个站的几个断言**。
 * 这些断言如何从原始数据里算出来，属于业务规则而不是排版，因此集中在这里——
 * 页面只消费结论。
 *
 * 一条硬规则：**每一个数字都必须来自真实数据，不允许为了让页面好看而写死或放大。**
 * 演示夹具里只有 8 道题就是 8 道题；把它写成「10,000+」是首页最容易犯、
 * 也最容易被一眼看穿的错误。
 *
 * ── 曾经算过、现在不算了的东西 ──────────────────────────────────────────────
 *
 * · **比赛场次**：它是运营流水，不是站级体量。首页就算要「有多大」，
 *   也不该把「此刻有几场比赛」摆出来当门面。
 * · **难度构成 / 支持语言清单 / 专题清单**：读者不需要在首页知道
 *   「用的是 C++17 还是 Go 1.24」「标签里有没有 bitmask」——具体有哪些，
 *   是题库页与语言文档该回答的。首页留下一句「支持 N 种语言」就够了，
 *   那是**尺度**，不是清单。
 *
 * 收窄之后这个模块只干一件事：把「站有多大」算成三个数。
 * 它仍然单独成层，是因为「提交量 = 各题提交数之和」这条口径属于业务规则，
 * 写进页面组件就会变成排版里的隐式计算。
 */

export type SiteFacts = {
  problems: number;
  submissions: number;
  languages: number;
};

export async function loadHomeData(client: ApiClient = createApiClient()): Promise<SiteFacts> {
  const [{ items: problems }, { items: languages }] = await Promise.all([
    listProblems(),
    client.languages.list({ enabled: true }),
  ]);

  return summarizeSiteFacts(problems, languages);
}

/**
 * 站级数字。
 *
 * 注意「提交量」是**题目提交数之和**（全站尺度），而不是某个人的提交数——
 * 后者对访客毫无意义。
 */
export function summarizeSiteFacts(
  problems: Pick<ProblemSummary, "submissionCount">[],
  languages: unknown[],
): SiteFacts {
  return {
    problems: problems.length,
    submissions: problems.reduce((total, problem) => total + problem.submissionCount, 0),
    languages: languages.length,
  };
}
