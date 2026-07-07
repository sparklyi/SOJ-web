import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";

type AccountSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  signal?: ReactNode;
  children: ReactNode;
};

export function AccountSurface({ eyebrow, title, description, meta, signal, children }: AccountSurfaceProps) {
  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <section className="soj-account-stage soj-scanline soj-enter p-5 md:p-7">
          <div className="relative z-[1] grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className="grid content-between gap-7">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-soj-accent/50 bg-soj-accent/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-soj-accent">
                    {eyebrow}
                  </span>
                  {meta ? <span className="font-mono text-xs text-soj-muted">{meta}</span> : null}
                </div>
                <div className="grid gap-3">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-soj-text md:text-6xl">{title}</h1>
                  <p className="max-w-2xl text-base leading-7 text-soj-muted">{description}</p>
                </div>
              </div>
            </div>
            {signal ? <aside className="soj-account-signal grid content-between gap-5 p-5">{signal}</aside> : null}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
