"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/ui/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "soj-inset-light inline-flex h-10 items-center justify-between gap-3 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm text-soj-text transition hover:border-soj-accent/60",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      {/* position="popper" 必须显式给：默认的 item-aligned 模式在 sticky 页头里
          会把面板定位到视口外（量到过 y≈1186），弹出的菜单等于不存在。 */}
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-soj-md border border-soj-line bg-soj-bg-raised text-soj-text shadow-2xl shadow-black/35",
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
      className={cn("cursor-pointer px-3 py-2 text-sm text-soj-muted outline-none transition hover:bg-soj-surface hover:text-soj-text data-[state=checked]:text-soj-accent", className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
