"use client";

import type { ReactNode } from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250}>
      <ToastProvider swipeDirection="right">
        {children}
        <ToastViewport className="fixed bottom-4 right-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-3" />
      </ToastProvider>
    </TooltipProvider>
  );
}
