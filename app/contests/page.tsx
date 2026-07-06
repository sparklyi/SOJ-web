import { PageShell } from "@/components/layout/page-shell";
import { ContestList } from "@/features/contests/detail/contest-list";
import { listContests } from "@/features/contests/api";

export default async function ContestsPage() {
  const { items } = await listContests();

  return (
    <PageShell title="Contests" description="Live rounds, registration windows, freeze state, and entry routes for SOJ competition surfaces.">
      <ContestList contests={items} />
    </PageShell>
  );
}
