"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AuthedData } from "@/components/auth/use-authed-data";

/**
 * 比赛子页（赛场 / 排行榜 / 答题）共用的非就绪态渲染。
 *
 * 比赛内容已全部要求登录，这几个页面原本在服务端取比赛数据——
 * 服务端读不到浏览器会话，匿名请求会被后端 401 拒掉、整页 500。
 * 现在取数在客户端完成（会话与登录墙由上游 `SessionGate` 负责），
 * 这里的职责只剩：加载中给骨架、比赛不存在给空态、出错给一句话；
 * ready 时返回 null，正文由页面自己渲染。
 */
export function ContestSubpageState({ state }: { state: AuthedData<unknown> }) {
  const { t } = useI18n();

  if (state.status === "loading" || state.status === "auth") {
    return (
      <div className="grid gap-4" aria-hidden>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (state.status === "notFound") {
    return (
      <div className="grid place-items-center py-16">
        <EmptyState title={t("contests.notFoundTitle")} description={t("contests.notFoundDescription")} />
      </div>
    );
  }

  if (state.status === "error") {
    return <div className="grid place-items-center py-16 text-sm text-soj-muted">{state.message}</div>;
  }

  return null;
}
