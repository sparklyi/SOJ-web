"use client";

import type { ReactNode } from "react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type AuthWallProps = {
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * 登录墙 / 权限墙。
 *
 * 这里此前有两套并存的视觉：管理后台是**左对齐横条 + 一个纯文字链接**，
 * 赛事角色 / 审核 / 用户管理是**居中卡片 + 描边按钮**。同一个产品里，
 * 用户会在不同的入口撞见两种登录墙，而横条那套连正文都没有。
 * 现在只有这一个形态：一句话说清状态、一句正文解释范围、一个明确的出口。
 *
 * `my-auto` 是故意的：两个页面壳都撑到 `min-h-dvh`，门面板如果在剩余高度里
 * 顶到上边，下面就会留出 400px 的空白（页脚被推到屏幕外）。让它吸收剩余空间，
 * 空白被分到上下两侧，读起来是「一屏的空态」而不是「页面没做完」。
 */
export function AuthWall({ title, body, actionHref, actionLabel, children, className }: AuthWallProps) {
  return (
    <div
      className={cn(
        "mx-auto my-auto w-full max-w-xl rounded-soj-lg border border-soj-line/70 bg-soj-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-base font-medium text-soj-text">{title}</p>
      {body ? <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-soj-muted">{body}</p> : null}
      {children}
      {actionHref && actionLabel ? (
        <div className="mt-6 flex justify-center">
          <LocalizedLink href={actionHref} className={buttonVariants({ variant: "secondary", size: "md" })}>
            {actionLabel}
          </LocalizedLink>
        </div>
      ) : null}
    </div>
  );
}
