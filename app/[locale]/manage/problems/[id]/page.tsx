import { notFound } from "next/navigation";
import { ProblemWizard } from "@/features/problems/authoring/problem-wizard";

type ManageProblemPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
};

export default async function ManageProblemPage({ params, searchParams }: ManageProblemPageProps) {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId) || problemId <= 0) notFound();
  const { step } = await searchParams;
  return <ProblemWizard problemId={problemId} initialStep={step ?? null} />;
}
