import type { ReactNode } from "react";
import { TopNav } from "./top-nav";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <main className="min-w-0" id="main-content">
          {title ? (
            <header className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-3 border-b border-soj-line/70 pb-6">
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
