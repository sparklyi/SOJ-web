import { notFound } from "next/navigation";
import { SessionGate } from "@/components/auth/session-gate";
import { TopNav } from "@/components/layout/top-nav";
import { ContestScoreboardClient } from "@/features/contests/scoreboard/contest-scoreboard-client";

/**
 * 排行榜页。
 *
 * 比赛内容已全部要求登录：`SessionGate` 在会话落定前不渲染内容
 * （匿名 → 登录墙），取数由客户端带 token 完成，见 `ContestScoreboardClient`。
 */
export default async function ContestScoreboardRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <SessionGate>
          <ContestScoreboardClient contestId={contestId} />
        </SessionGate>
      </main>
    </div>
  );
}
