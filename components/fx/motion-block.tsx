"use client";

import type { ReactNode } from "react";
import { useReveal } from "./use-reveal";

type MotionBlockProps = {
  children: ReactNode;
  className?: string;
  /** 同组元素依次入场的错位延迟（毫秒）。 */
  delay?: number;
};

/**
 * 滚动揭示的载体。
 *
 * 服务端组件不能直接用 hook，所以给它一个极薄的客户端外壳。
 * 外壳本身不带任何样式，只承接页面网格里那一格的位置。
 */
export function MotionBlock({ children, className, delay = 0 }: MotionBlockProps) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
