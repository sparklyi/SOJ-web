"use client";

import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import { useI18n } from "@/components/providers/i18n-provider";
import { getContest } from "@/features/contests/api";
import { ContestDetail } from "@/features/contests/detail/contest-detail";

/**
 * 比赛详情（客户端取数）。
 *
 * 比赛内容已全部要求登录：会话与登录墙由上游 `SessionGate` 负责，
 * 这里只在已登录的前提下带 token 取数；「比赛不存在」渲染成空态而非整页报错。
 */
export function ContestDetailClient({ contestId }: { contestId: number }) {
  const { t } = useI18n();
  const state = useAuthedData(() => getContest(contestId, createBrowserApiClient()));

  if (state.status === "loading" || state.status === "auth") {
    return (
      <div className="grid gap-4" aria-hidden>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (state.status === "notFound") {
    return (
      <Panel>
        <EmptyState
          icon={SearchX}
          title={t("contests.notFoundTitle")}
          description={t("contests.notFoundDescription")}
          action={
            <LocalizedLink href="/contests" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {t("contests.backToList")}
            </LocalizedLink>
          }
        />
      </Panel>
    );
  }

  if (state.status === "error") {
    return (
      <Panel>
        <p className="px-6 py-12 text-center text-sm text-soj-muted">{state.message}</p>
      </Panel>
    );
  }

  return <ContestDetail contest={state.data} />;
}
