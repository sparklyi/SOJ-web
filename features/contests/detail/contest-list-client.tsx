"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthedData } from "@/components/auth/use-authed-data";
import { createBrowserApiClient } from "@/lib/api/client";
import { useI18n } from "@/components/providers/i18n-provider";
import { listContests } from "@/features/contests/api";
import { ContestList } from "@/features/contests/detail/contest-list";

/**
 * 赛事列表（客户端取数）。
 *
 * 比赛内容已全部要求登录：会话与登录墙由上游 `SessionGate` 负责，
 * 这里只在已登录的前提下带 token 取数。
 */
export function ContestListClient() {
  const { t } = useI18n();
  const state = useAuthedData(() => listContests(createBrowserApiClient()));

  if (state.status === "loading" || state.status === "auth") {
    return (
      <div className="grid gap-4" aria-hidden>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (state.status === "notFound" || state.status === "error") {
    return (
      <Panel variant="flush">
        <p className="px-6 py-12 text-center text-sm text-soj-muted">
          {state.status === "error" ? state.message : t("common.loadError")}
        </p>
      </Panel>
    );
  }

  if (state.data.items.length === 0) {
    return (
      <Panel>
        <EmptyState title={t("contests.list.empty")} description={t("contests.list.emptyDescription")} />
      </Panel>
    );
  }

  return <ContestList contests={state.data.items} />;
}
