"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/ui/cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, ...props }: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={6}
        className={cn("z-50 rounded-soj-sm border border-soj-line bg-soj-bg-raised px-2 py-1 text-xs text-soj-text shadow-lg shadow-black/25", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
