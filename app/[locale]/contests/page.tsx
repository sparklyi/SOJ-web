import { SessionGate } from "@/components/auth/session-gate";
import { PageShell } from "@/components/layout/page-shell";
import { ContestListClient } from "@/features/contests/detail/contest-list-client";

/**
 * 赛事列表页。
 *
 * 比赛内容已全部要求登录（后端 SOJ 的比赛读接口只放行已登录 actor）。
 * 服务端组件读不到浏览器里的会话，取数下沉到客户端：
 * `SessionGate` 先等会话落定（匿名 → 登录墙），放行后才带 token 取数。
 */
export default function ContestsPage() {
  return (
    <PageShell>
      <SessionGate>
        <ContestListClient />
      </SessionGate>
    </PageShell>
  );
}
