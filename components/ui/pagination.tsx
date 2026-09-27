"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * 后台列表分页：页码居中、总数靠右，只接受点击（不做手动输入跳页）。
 *
 * 页码窗口是经典省略号式：两端始终可见，当前页左右各展开一个，中间用 `…`
 * 收拢，所以页数很多时也不会退化成一条长条。
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const items = pageItems(page, totalPages);

  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-soj-line px-4 py-3", className)}>
      <span aria-hidden />
      <nav aria-label={t("pagination.label")} className="flex items-center justify-center gap-1">
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
