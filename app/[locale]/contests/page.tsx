import { PageShell } from "@/components/layout/page-shell";
import { ContestList } from "@/features/contests/detail/contest-list";
import { listContests } from "@/features/contests/api";

export default async function ContestsPage() {
  const { items } = await listContests();

  return (
    <PageShell>
      <ContestList contests={items} />
    </PageShell>
  );
}
