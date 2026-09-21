import { Suspense } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { PageShell } from "@/components/layout/page-shell";
import { ProblemListClient } from "@/features/problems/problem-list-client";

/**
 * 题库页。
 *
 * 题库内容已全部要求登录（后端 SOJ 的题目读接口只放行已登录 actor）。
 * 服务端组件读不到浏览器里的会话，所以取数下沉到客户端：
 * `SessionGate` 先等会话落定（匿名 → 登录墙），放行后才带 token 取数。
 * searchParams 驱动的筛选在客户端解析，URL 语义不变。
 */
export default function ProblemsPage() {
  return (
    <PageShell>
      <SessionGate>
        <Suspense>
          <ProblemListClient />
        </Suspense>
      </SessionGate>
    </PageShell>
  );
}
