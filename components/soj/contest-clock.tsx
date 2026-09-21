"use client";

import { ContestCountdown } from "@/components/soj/contest-countdown";

type ContestClockProps = {
  label: string;
  /** 静态读数。给了 `until` 时它会被忽略。 */
  value?: string;
  /** ISO 时间。给了它就按客户端时钟倒计时。 */
  until?: string;
};

/**
 * 比赛时钟（单行读数，用于工作区与详情页的侧栏）。
 *
 * 旧形态是一张独立卡片，里面用 3xl 字号撑出一个孤立的数字，
 * 在首屏上占了近三分之一宽度却只表达一个状态。现在收成单行。
 *
 * 两个曾经的问题：一是**状态徽标**（「进行中 / 已冻结」）和读数常常是同一个词
 * ——比赛详情页因此把「进行中」在一屏里说了三遍；状态由页头的胶囊表达，
 * 时钟只负责读数。二是读数曾经是**写死的字符串**（`value="00:47:18"`），
 * 无论什么时候打开都是那一个数：现在传 `until` 即按真实剩余时间每秒走。
 */
export function ContestClock({ label, value, until }: ContestClockProps) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="text-xs text-soj-muted">{label}</span>
      {until ? (
        <ContestCountdown until={until} className="text-sm font-semibold text-soj-text" />
      ) : value ? (
        <span className="font-mono text-sm font-semibold tabular-nums text-soj-text">{value}</span>
      ) : null}
    </span>
  );
}
