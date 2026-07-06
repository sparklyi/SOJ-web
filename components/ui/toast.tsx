"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/ui/cn";

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ToastPrimitive.Viewport;
export const Toast = ToastPrimitive.Root;
export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;

export function ToastSurface({ className, ...props }: ToastPrimitive.ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn("rounded-soj-md border border-soj-line bg-soj-bg-raised p-4 text-sm text-soj-text shadow-xl shadow-black/25", className)}
      {...props}
    />
  );
}
