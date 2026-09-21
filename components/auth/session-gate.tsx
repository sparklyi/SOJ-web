"use client";

import type { ReactNode } from "react";
import { AuthWall } from "@/components/auth/auth-wall";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 会话门槛（客户端）。
 *
 * 题库与比赛内容改为**全部要求登录**之后（后端 SOJ 已把对应读接口锁到已登录 actor），
 * 这些页面不能再靠服务端取数渲染——服务端拿不到 localStorage 里的会话，
 * 匿名请求会在后端 401，页面只会剩下 500。
 * 所以内容页统一改成：先在本组件里等会话落定，匿名 → 登录墙，
 * 已登录 → 才放行子组件去取数（浏览器客户端会带上 token）。
 *
 * 骨架占位不是装饰：会话校验要打一次 `/me`，没有占位的话
 * 页面会从空白直接跳到内容，读起来像闪了一下。
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <div className="grid gap-4 py-10" aria-hidden>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <AuthWall
        title={t("gate.signInRequired")}
        body={t("gate.signInBody")}
        actionHref="/auth/login"
        actionLabel={t("gate.signIn")}
      />
    );
  }

  return children;
}
