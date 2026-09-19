import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * 表格原语。
 *
 * 密度向「专业赛事榜」看齐：表头用极小号大写字 + 冷灰色，行高收紧，
 * hover 只做极轻的表面抬升。表头默认可以吸顶，长列表滚动时不丢列名。
 */
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />;
}

type TableHeadProps = HTMLAttributes<HTMLTableSectionElement> & {
  /** 吸附在滚动容器顶部（需要外层具备 overflow 滚动上下文）。 */
  sticky?: boolean;
};

export function TableHead({ className, sticky = false, ...props }: TableHeadProps) {
  return (
    <thead
      className={cn(
        "border-b border-soj-line text-[11px] font-medium uppercase tracking-[0.12em] text-soj-faint",
        sticky && "[&>tr>th]:sticky [&>tr>th]:top-0 [&>tr>th]:z-10 [&>tr>th]:bg-soj-bg-raised",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-soj-line/60 transition-colors duration-150 hover:bg-soj-surface/55", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-3 py-2.5 font-medium", className)} {...props} />;
}
