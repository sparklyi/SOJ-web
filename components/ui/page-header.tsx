import type { ReactNode } from "react";

/**
 * 页面级页头。
 *
 * 旧实现把「题目集」这类大标题塞进密集面板内部，标题和表格抢同一块区域，
 * 结果是既不像页面标题、又挤掉了表格空间。页头必须独立于内容容器存在，
 * 并统一承载 eyebrow / 描述 / 操作 / 元信息四层。
 *
 * eyebrow 前面那条短横线不是装饰：全站每个页头都有它，它给页面建立一条
 * 统一的左基准线，读者的视线每次落到页头都能立刻认出「这里开始是新页面」。
 */
type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={className}>
      <div className="grid gap-4 border-b border-soj-line pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid min-w-0 gap-1.5">
          {eyebrow ? (
            <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-soj-faint">
              <span aria-hidden className="h-px w-6 shrink-0 bg-soj-accent/70" />
              <span className="min-w-0">{eyebrow}</span>
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-soj-text md:text-[28px]">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-soj-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4">{meta}</div> : null}
    </header>
  );
}
