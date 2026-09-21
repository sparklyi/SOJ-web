import { notFound } from "next/navigation";
import { SessionGate } from "@/components/auth/session-gate";
import { TopNav } from "@/components/layout/top-nav";
import { ContestWorkspaceClient } from "@/features/contests/workspace/contest-workspace-client";

/**
 * 比赛答题页。
 *
 * 比赛内容已全部要求登录：`SessionGate` 在会话落定前不渲染内容
 * （匿名 → 登录墙），取数由客户端带 token 完成，见 `ContestWorkspaceClient`。
 */
export default async function ContestProblemRoute({ params }: { params: Promise<{ id: string; problemId: string }> }) {
  const { id, problemId } = await params;
  const contestId = Number(id);
  const parsedProblemId = Number(problemId);

  if (!Number.isInteger(contestId) || !Number.isInteger(parsedProblemId)) {
    notFound();
  }

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <SessionGate>
          <ContestWorkspaceClient contestId={contestId} problemId={parsedProblemId} />
        </SessionGate>
      </main>
    </div>
  );
}
