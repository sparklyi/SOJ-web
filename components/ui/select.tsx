"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/ui/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "inline-flex h-10 items-center justify-between gap-3 rounded-soj-md border border-soj-line bg-soj-bg-raised px-3 text-sm text-soj-text shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition hover:border-soj-accent/60",
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
      <SelectPrimitive.Content className={cn("z-50 overflow-hidden rounded-soj-md border border-soj-line bg-soj-bg-raised text-soj-text shadow-2xl shadow-black/35", className)} {...props} />
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
