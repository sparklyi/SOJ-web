"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, asChild, ...props }: SelectPrimitive.SelectTriggerProps) {
  const triggerClassName = cn(
    "soj-inset-light inline-flex h-10 items-center justify-between gap-3 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm text-soj-text transition hover:border-soj-accent/60",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
    className,
  );

  // 下拉箭头是「这里能展开」的全部暗示：没有它，触发器就只是一块写着
  // 当前值的牌子，跟旁边的静态标签长得一样。
  //
  // `asChild` 必须走单独一条分支，不能写成「箭头条件渲染」：Radix 的 Slot
  // 要求 children 本身是**单个元素**（`React.isValidElement(children)`），
  // 而 JSX 里多一个 `{cond ? null : …}` 就会把 children 变成数组，
  // 即使那个位置是 null 也会让 `asChild` 直接抛错。
  if (asChild) {
    return (
      <SelectPrimitive.Trigger asChild className={triggerClassName} {...props}>
        {children}
      </SelectPrimitive.Trigger>
    );
  }

  return (
    <SelectPrimitive.Trigger className={triggerClassName} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-soj-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      {/* position="popper" 必须显式给：默认的 item-aligned 模式在 sticky 页头里
          会把面板定位到视口外（量到过 y≈1186），弹出的菜单等于不存在。 */}
      {/* 入场动画不是装饰：popper 新建合成层时 Chromium 可能闪一帧白底，
          首帧从透明淡入即可把闪帧完全遮蔽。 */}
      {/* p-1 也不是装饰，少了它高亮项就是一条贴死边框的直角横杠：
          面板 `overflow-hidden` 会把项的圆角齐头切掉，只剩一条横贯面板的
          实心方块，在圆角面板里看着像卡住了。留 4px 内边距，项自身再带
          `rounded-soj-sm`，高亮块才是浮在面板里的一块，而不是面板本身。 */}
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "soj-pop-in z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-soj-md border border-soj-line bg-soj-bg-raised p-1 text-soj-text shadow-2xl shadow-black/35",
          className,
        )}
        {...props}
      />
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "cursor-pointer rounded-soj-sm px-3 py-2 text-sm text-soj-muted outline-none transition data-[highlighted]:bg-soj-surface data-[highlighted]:text-soj-text data-[state=checked]:text-soj-accent",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
