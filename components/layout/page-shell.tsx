import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopNav } from "./top-nav";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-dvh bg-soj-bg text-soj-text">
      <TopNav />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)]">
        <AppSidebar />
        <main className="min-w-0 px-5 py-8 md:px-8" id="main-content">
          {title ? (
            <header className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-3 border-b border-soj-line pb-6">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
              {description ? <p className="max-w-2xl text-sm leading-6 text-soj-muted">{description}</p> : null}
            </header>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
