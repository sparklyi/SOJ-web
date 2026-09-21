import { notFound } from "next/navigation";
import { SessionGate } from "@/components/auth/session-gate";
import { TopNav } from "@/components/layout/top-nav";
import { ContestArenaClient } from "@/features/arena/contest-arena-client";

/**
 * 赛场页。
 *
 * 比赛内容已全部要求登录：`SessionGate` 在会话落定前不渲染内容
 * （匿名 → 登录墙），取数由客户端带 token 完成，见 `ContestArenaClient`。
 * 旧版在服务端取数，匿名请求被后端 401 拒掉后整页 500。
 */
export default async function ContestArenaRoute({ params }: { params: Promise<{ id: string }> }) {
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
          <ContestArenaClient contestId={contestId} />
        </SessionGate>
      </main>
    </div>
  );
}
