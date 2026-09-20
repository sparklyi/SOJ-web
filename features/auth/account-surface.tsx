import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TopNav } from "@/components/layout/top-nav";

type AccountSurfaceProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  aside?: ReactNode;
  children: ReactNode;
};

/**
 * 账号域整页壳（/me、/settings、/auth/*）。
 *
 * 它曾经自带第三套页头规格：一块大英雄面板（soj-account-stage + 已失效的
 * soj-scanline）+ 圆角胶囊 eyebrow + text-4xl/6xl 标题。那是「舞台类」时代的残留，
 * 与 PageShell / PageHeader 三套规格并存。现在它只是 PageHeader 的薄封装：
 * 同一条左基准线、同一个字号尺度，账号页与题库页读起来是同一个产品。
 */
export function AccountSurface({ eyebrow, title, description, meta, aside, children }: AccountSurfaceProps) {
  return (
    <div className="min-h-dvh text-soj-text">
      <TopNav />
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        <PageHeader eyebrow={eyebrow} title={title} description={description} meta={meta} aside={aside} />
        {children}
      </main>
    </div>
  );
}
