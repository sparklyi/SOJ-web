import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { ContestDetail } from "@/features/contests/detail/contest-detail";
import { getContest } from "@/features/contests/api";
import { ApiError } from "@/lib/api/errors";

type ContestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  const contest = await loadContest(contestId);

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <ContestDetail contest={contest} />
      </main>
    </div>
  );
}

async function loadContest(contestId: number) {
  try {
    return await getContest(contestId);
  } catch (error) {
    if (error instanceof ApiError && error.code === "not_found") {
      notFound();
    }

    throw error;
  }
}
