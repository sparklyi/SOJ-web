import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
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
    <PageShell title={contest.title} description="Contest lifecycle, access, rules, announcements, problem aliases, scoreboard entry, and Arena entry.">
      <ContestDetail contest={contest} />
    </PageShell>
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
