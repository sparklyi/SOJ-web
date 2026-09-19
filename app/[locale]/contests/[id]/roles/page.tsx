import { notFound } from "next/navigation";
import { ContestRoleManager } from "@/features/contests/role-manager";

type ContestRolesRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ContestRolesRoute({ params }: ContestRolesRouteProps) {
  const { id } = await params;
  const contestId = Number(id);

  if (!Number.isInteger(contestId)) {
    notFound();
  }

  return <ContestRoleManager contestId={contestId} />;
}
