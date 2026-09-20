"use client";

import { useLayoutEffect, useRef } from "react";
import { formatNumber } from "@/lib/ui/number";

type CountUpProps = {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
};

/**
 * 数字滚动。
 *
 * 两个刻意的选择：
 *  1. 服务端渲染的是**最终值**，不是 0。于是禁用脚本、被测试断言、被爬虫抓取时
 *     拿到的都是真实数字，不会出现「页面上写着 0」这种事。
 *  2. 动画直接写 textContent，不走 state。60fps 重渲染几个数字看起来不贵，
 *     但会让整个子树跟着重算，首屏代价没有必要。
 *
 * 用 useLayoutEffect：在浏览器绘制之前把文本换成 0，避免「先闪最终值、再跳回 0」。
 * 千分位走 formatNumber，与页面其他位置的数字保持同一种写法。
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 1200,
  prefix = "",
  suffix = "",
  locale,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const format = (input: number) => `${prefix}${formatNumber(input, { locale, decimals })}${suffix}`;
    let raf = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      const startAt = performance.now();
      element.textContent = format(0);
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startAt) / duration);
        const eased = 1 - (1 - progress) ** 3;
        element.textContent = format(value * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
        else element.textContent = format(value);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.3 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [decimals, duration, locale, prefix, suffix, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value, { locale, decimals })}
      {suffix}
    </span>
  );
}
