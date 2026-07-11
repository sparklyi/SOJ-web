import { notFound } from "next/navigation";
import { ProblemWorkbench } from "@/features/problems/authoring/problem-workbench";

type ManageProblemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManageProblemPage({ params }: ManageProblemPageProps) {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId) || problemId <= 0) notFound();
  return <ProblemWorkbench problemId={problemId} />;
}
