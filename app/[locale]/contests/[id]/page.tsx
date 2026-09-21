import { notFound } from "next/navigation";
import { SessionGate } from "@/components/auth/session-gate";
import { PageShell } from "@/components/layout/page-shell";
import { ContestDetailClient } from "@/features/contests/detail/contest-detail-client";

/**
 * 比赛详情页。
 *
 * 比赛内容已全部要求登录：`SessionGate` 在会话落定前不渲染内容
 * （匿名 → 登录墙），取数由客户端带 token 完成，见 `ContestDetailClient`。
 * 非数字 id 仍然在路由层直接 notFound，这个判断不需要会话。
 */
export default async function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  return (
    <PageShell>
      <SessionGate>
        <ContestDetailClient contestId={contestId} />
      </SessionGate>
    </PageShell>
  );
}
