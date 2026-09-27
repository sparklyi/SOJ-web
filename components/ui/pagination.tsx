"use client";

import { FormEvent } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/ui/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * 后台列表分页：上一页 / 下一页 + 页码直接跳转。
 *
 * 页码输入用 `key={page}` 重挂载来同步当前页，而不是在 effect 里 setState
 * （那会触发级联渲染，且仓库的 react-hooks 规则直接拒绝）。只有一页时不渲染。
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function jump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("page-jump");
    const parsed = input instanceof HTMLInputElement ? Number.parseInt(input.value, 10) : Number.NaN;
    if (Number.isNaN(parsed)) return;
    onPageChange(Math.min(Math.max(parsed, 1), totalPages));
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t border-soj-line px-4 py-3", className)}>
      <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t("pagination.previous")}
      </Button>
      <span className="text-xs text-soj-muted">{t("pagination.pageOf", { page, total: totalPages })}</span>
      <form onSubmit={jump} className="flex items-center gap-2">
        <Input
          key={page}
          name="page-jump"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={page}
          aria-label={t("pagination.jump")}
          className="h-8 w-20"
        />
        <Button type="submit" variant="secondary" size="sm">
          {t("pagination.go")}
        </Button>
      </form>
      <Button type="button" variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t("pagination.next")}
      </Button>
    </div>
  );
}
