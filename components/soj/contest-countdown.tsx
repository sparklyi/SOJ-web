"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/ui/cn";

type ContestCountdownProps = {
  /** ISO 时间。倒计时必须相对 now 算——写死的读数（`"00:47:18"`）不管什么时候打开都是同一个数。 */
  until?: string;
  /** 客户端算出真实值之前的首帧占位，服务端与首帧渲染一致，避免水合不匹配。 */
  placeholder?: string;
  className?: string;
};

/**
 * 比赛倒计时读数。
 *
 * 竞技场的冻结倒计时和比赛详情页的时钟读数是同一个东西，只有字号不同，
 * 所以读数本身是一个组件，字号交给调用方。
 */
export function ContestCountdown({ until, placeholder = "--:--:--", className }: ContestCountdownProps) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!until) return;
    const target = Date.parse(until);
    if (!Number.isFinite(target)) return;

    const tick = () => setRemaining(formatCountdown(target - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  return <span className={cn("font-mono tabular-nums", className)}>{until ? (remaining ?? placeholder) : placeholder}</span>;
}

/** 毫秒 → `HH:MM:SS`。读数不含日期，所以不带 locale 参数。 */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
