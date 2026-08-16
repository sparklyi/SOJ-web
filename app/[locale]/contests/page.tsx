import { TopNav } from "@/components/layout/top-nav";
import { ContestList } from "@/features/contests/detail/contest-list";
import { listContests } from "@/features/contests/api";

export default async function ContestsPage() {
  const { items } = await listContests();

  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <ContestList contests={items} />
      </main>
    </div>
  );
}
