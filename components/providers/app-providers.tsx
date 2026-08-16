"use client";

import type { ReactNode } from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { AuthProvider } from "./auth-provider";
import { I18nProvider } from "./i18n-provider";

export function AppProviders({ children, locale = defaultLocale }: { children: ReactNode; locale?: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <AuthProvider>
        <TooltipProvider delayDuration={250}>
          <ToastProvider swipeDirection="right">
            {children}
            <ToastViewport className="fixed bottom-4 right-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-3" />
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
