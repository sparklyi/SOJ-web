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
import { ProblemDetailView } from "@/features/problems/problem-detail-view";

/**
 * 题目详情（客户端取数）。
 *
 * 题目详情已要求登录：服务端组件拿不到浏览器会话，匿名 SSR 只会拿到 401。
 * 会话与登录墙由上游 `SessionGate` 负责；这里只在已登录的前提下取数，
 * 并把「题目不存在」渲染成设计过的空态，而不是 notFound 的整页灰屏。
 */
export function ProblemDetailClient({ problemId }: { problemId: number }) {
  const { t } = useI18n();
  const state = useAuthedData(() => createBrowserApiClient().problems.get(problemId));

  if (state.status === "loading" || state.status === "auth") {
    return (
      <div className="grid gap-4" aria-hidden>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (state.status === "notFound") {
    return (
      <Panel>
        <EmptyState
          icon={SearchX}
          title={t("problems.notFoundTitle")}
          description={t("problems.notFoundDescription")}
          action={
            <LocalizedLink href="/problems" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {t("problems.backToSet")}
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

  return <ProblemDetailView problem={state.data} />;
}
