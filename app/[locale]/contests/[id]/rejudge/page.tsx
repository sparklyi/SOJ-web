import { notFound } from "next/navigation";
import { ContestRejudgeConsole } from "@/features/rejudge/rejudge-console";

type ContestRejudgeRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ContestRejudgeRoute({ params }: ContestRejudgeRouteProps) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  return <ContestRejudgeConsole contestId={contestId} />;
}
