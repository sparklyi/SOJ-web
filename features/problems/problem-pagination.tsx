"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/components/providers/i18n-provider";

export function ProblemPagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { localize } = useI18n();
  const [pending, startTransition] = useTransition();

  function navigate(nextPage: number, nextSize = pageSize) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    next.set("page_size", String(nextSize));
    startTransition(() => router.push(localize(`${pathname}?${next.toString()}`)));
  }

  return (
    <div aria-busy={pending} className={pending ? "pointer-events-none opacity-60" : undefined}>
      <Pagination page={page} pageSize={pageSize} total={total} pageSizeOptions={Array.from(new Set([pageSize, 10, 20, 50, 100])).sort((a, b) => a - b)} onPageChange={navigate} onPageSizeChange={(size) => navigate(1, size)} />
    </div>
  );
}
