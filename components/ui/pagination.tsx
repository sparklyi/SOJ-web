"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/ui/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** 提供后左侧出现「每页 N 条」选择器；没有它时单页列表不渲染分页条。 */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
};

const defaultPageSizeOptions = [10, 20, 50, 100];

/**
 * 后台列表分页：左侧每页条数、页码居中、总数靠右，只接受点击（不做手动输入跳页）。
 *
 * 页码窗口是经典省略号式：两端始终可见，当前页左右各展开一个，中间用 `…`
 * 收拢，所以页数很多时也不会退化成一条长条。
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = defaultPageSizeOptions,
  className,
}: PaginationProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  if (totalPages <= 1 && !onPageSizeChange) return null;
  const items = totalPages > 1 ? pageItems(page, totalPages) : [];

  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-soj-line px-4 py-3", className)}>
      <div className="flex items-center">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs text-soj-muted">
            {t("pagination.pageSize")}
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="h-8 w-[72px]" aria-label={t("pagination.pageSize")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>
      <nav aria-label={t("pagination.label")} className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto">
        {totalPages > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              disabled={page <= 1}
              aria-label={t("pagination.previous")}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </Button>
            {items.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} aria-hidden className="px-1 text-xs text-soj-faint">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? "secondary" : "ghost"}
                  size="sm"
                  className="w-8 px-0"
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              disabled={page >= totalPages}
              aria-label={t("pagination.next")}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </nav>
      <span className="justify-self-end text-xs text-soj-muted">{t("pagination.total", { total })}</span>
    </div>
  );
}

function pageItems(current: number, totalPages: number): Array<number | "ellipsis"> {
  // first + last + current + 2 siblings + 2 ellipses: below this, showing every
  // page is shorter than the ellipsis form.
  const denseThreshold = 7;
  if (totalPages <= denseThreshold) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);
  const items: Array<number | "ellipsis"> = [1];
  if (left > 2) items.push("ellipsis");
  for (let value = left; value <= right; value += 1) items.push(value);
  if (right < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}
