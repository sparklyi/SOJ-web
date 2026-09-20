import { createApiClient } from "@/lib/api/client";
import type { ApiClient, SiteFacts } from "@/lib/api/types";

export type { SiteFacts } from "@/lib/api/types";

/**
 * 首页的数据整形层。
 *
 * 首页是「展台」，所以它需要的不是「某一批记录」，而是**关于这个站的几个断言**。
 *
 * 一条硬规则：**每一个数字都必须来自真实数据，不允许为了让页面好看而写死或放大。**
 *
 * ── 曾经算过、现在不算了的东西 ──────────────────────────────────────────────
 *
 * · **比赛场次**：它是运营流水，不是站级体量。首页就算要「有多大」，
 *   也不该把「此刻有几场比赛」摆出来当门面。
 * · **难度构成 / 支持语言清单 / 专题清单**：读者不需要在首页知道
 *   「用的是 C++17 还是 Go 1.24」「标签里有没有 bitmask」——具体有哪些，
 *   是题库页与语言文档该回答的。首页留下一句「支持 N 种语言」就够了，
 *   那是**尺度**，不是清单。
 * · **在前端现算三数**：曾经是拉一页题目列表和语言列表、在浏览器里数出来。
 *   那有两个错：题目超过一页就数漏（page_size 截断）；每次渲染都要
 *   全量拉两张表。现在后端 `GET /api/v1/stats/site` 一次性给出聚合，
 *   Redis 缓存、写路径（发布题目 / 新提交 / 语言增改）按「先 PG 后 Redis」
 *   主动刷新——前端只剩消费结论这一件事。
 */

export async function loadHomeData(client: ApiClient = createApiClient()): Promise<SiteFacts> {
  return client.stats.site();
}
