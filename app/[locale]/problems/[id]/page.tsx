import { notFound } from "next/navigation";
import { SessionGate } from "@/components/auth/session-gate";
import { PageShell } from "@/components/layout/page-shell";
import { ProblemDetailClient } from "@/features/problems/problem-detail-client";

/**
 * 题目详情页。
 *
 * 题目内容已全部要求登录：`SessionGate` 在会话落定前不渲染内容
 * （匿名 → 登录墙），取数由客户端带 token 完成，见 `ProblemDetailClient`。
 * 非数字 id 仍然在路由层直接 notFound，这个判断不需要会话。
 */
export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = Number(id);

  if (!Number.isInteger(problemId)) {
    notFound();
  }

  return (
    <PageShell>
      <SessionGate>
        <ProblemDetailClient problemId={problemId} />
      </SessionGate>
    </PageShell>
  );
}
