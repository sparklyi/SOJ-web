import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TopNav } from "./top-nav";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

/**
 * 整页壳：导航 + 1440 列 + main 地标。
 *
 * 曾经自带一套 `text-3xl md:text-5xl` 的大标题头，与 PageHeader 的
 * `text-2xl/28px` 是两套并存的页头规格——管理后台因此和前台不像同一个产品。
 * 现在标题一律走 PageHeader（无 eyebrow 时直接 h1），全站只剩一种页头。
 */
export function PageShell({ children, title, description }: PageShellProps) {
  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <main className="min-w-0" id="main-content">
          {title ? <PageHeader title={title} description={description} className="mb-8" /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
