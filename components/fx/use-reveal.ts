"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * useLayoutEffect 在服务端渲染阶段会触发 React 告警。
 * 客户端组件同样会被 SSR 成首屏 HTML，所以这里必须做同构处理。
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * 滚动揭示。
 *
 * 关键取舍：**默认可见，由 JS 主动「上膛」**。
 * 常见做法是服务端就渲染 `opacity: 0`，等 JS 淡入——那样一旦脚本失败、被拦截或
 * 报错，整页内容就永久不可见。这里反过来：元素默认正常显示，脚本就绪后才加上
 * `data-reveal="armed"` 把它压下去，进入视口再揭开。于是「无 JS」「reduced-motion」
 * 「IntersectionObserver 不可用」三种情况下内容都完整可读，只是没有动画。
 *
 * 返回的 ref 直接挂到已有元素上，不额外包一层 DOM——多出来的 wrapper 会破坏
 * 调用处的 grid / flex 布局，也会让 IntersectionObserver 量到错误的盒子。
 */
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 显式降级开关：`<html data-motion-off>` 时完全不启用揭示。
    // 用于整页截图与导出（这类工具不会真正滚动，触发不了 IntersectionObserver，
    // 内容会停在未揭示状态），也方便排查「元素不见了」时快速排除动效因素。
    if (document.documentElement.hasAttribute("data-motion-off")) return;
    if (typeof IntersectionObserver === "undefined") return;

    element.style.setProperty("--reveal-delay", `${delay}ms`);
    element.dataset.reveal = "armed";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}
