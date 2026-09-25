"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { ProblemDifficulty } from "@/lib/api/types";
import { DifficultyScale, type DifficultyCount } from "@/components/soj/difficulty-composition";
import { problemDifficultyLabelKey } from "@/lib/domain/problem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/ui/cn";

type ProblemFilterBarProps = {
  query?: string;
  difficulty?: ProblemDifficulty;
  tag?: string;
  tags: string[];
  /** 各难度档位的题量。它同时是分布信息，也是这一排按钮上的计数。 */
  difficultyCounts: DifficultyCount[];
};

/**
 * 题库筛选工具栏。
 *
 * 三处刻意的删减：
 *
 * 1. **难度从下拉框改成带计数的按钮组。**
 *    原先难度分布在页头单画一条堆叠条，难度筛选在下拉框里，同一个概念占两个地方，
 *    而且两处都要读者自己换算。现在合并成一个东西：按钮上的数字就是分布，
 *    点它就是筛选。数据图形出现在它能被**使用**的位置，而不是只被观看的位置。
 *
 * 2. **删掉「应用」按钮。** 三个下拉框本来就是 onChange 立即生效的，
 *    真正需要点「应用」的只有搜索框里那行字。为一个输入框养一个全宽的按钮，
 *    既误导（看起来像所有条件都要点它）又占掉了工具栏三分之一的高度。
 *    现在搜索回车即生效——这是搜索框的通用预期。
 *
 * 3. **难度不再进「已应用筛选」胶囊行。** 按钮组自己已经把选中态画出来了，
 *    再列一个可删的胶囊，同一件事在一屏里说了两遍。
 *
 * 工具栏用比面板更暗的一层底（bg-soj-bg/35），读起来像表格上沿的一条控制带，
 * 而不是又一张卡片——所以它只有下边界，没有圆角与描边。
 */
export function ProblemFilterBar({ query = "", difficulty, tag, tags, difficultyCounts }: ProblemFilterBarProps) {
  const { t, localize } = useI18n();
  const [search, setSearch] = useState(query);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficultyTotal = difficultyCounts.reduce((sum, item) => sum + item.count, 0);
  const hasFilters = Boolean(query || difficulty || tag);

  const activeFilters: Array<{ key: string; label: string }> = [];
  if (query) activeFilters.push({ key: "q", label: `${t("problems.search")} · ${query}` });
  if (tag) activeFilters.push({ key: "tag", label: tag });

  function replaceFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all" || value.trim() === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.replace(localize(next.size ? `${pathname}?${next.toString()}` : pathname));
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceFilter("q", search);
  }

  function clearFilter(key: string) {
    if (key === "q") setSearch("");
    replaceFilter(key, "");
  }

  function resetFilters() {
    setSearch("");
    startTransition(() => {
      router.replace(localize(pathname));
    });
  }

  return (
    <div className="grid gap-3 border-b border-soj-line bg-soj-bg/35 px-4 py-3.5" aria-busy={isPending}>
      <form className="grid gap-3" onSubmit={submitSearch} aria-label={t("problems.findNext")} role="search">
        <div className={cn("grid gap-3 transition-opacity lg:grid-cols-[minmax(200px,1fr)_auto_minmax(140px,168px)] lg:items-end", isPending && "pointer-events-none opacity-60")}>
          <Input
            id="problem-search"
            label={t("problems.search")}
            name="query"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("problems.searchPlaceholder")}
          />
          <div className="grid gap-1.5">
            <span className="text-xs text-soj-muted">{t("problems.difficulty")}</span>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("problems.difficulty")}>
              <FilterChip active={!difficulty} onClick={() => replaceFilter("difficulty", "")}>
                {t("problems.allDifficulties")}
                <ChipCount>{difficultyTotal}</ChipCount>
              </FilterChip>
              {difficultyCounts.map((item) => (
                <FilterChip
                  key={item.difficulty}
                  active={difficulty === item.difficulty}
                  onClick={() => replaceFilter("difficulty", difficulty === item.difficulty ? "" : item.difficulty)}
                >
                  <DifficultyScale difficulty={item.difficulty} />
                  {t(problemDifficultyLabelKey[item.difficulty])}
                  <ChipCount>{item.count}</ChipCount>
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs text-soj-muted">{t("problems.tag")}</span>
            <Select value={tag ?? "all"} onValueChange={(value) => replaceFilter("tag", value)}>
              <SelectTrigger className="w-full" aria-label={t("problems.tag")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("problems.allTags")}</SelectItem>
                {tags.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="soj-eyebrow">{t("problems.activeFilters")}</span>
          {activeFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => clearFilter(item.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-soj-sm border border-soj-line bg-soj-surface",
                "py-0.5 pr-1.5 pl-2 font-mono text-xs text-soj-muted transition-colors",
                "hover:border-soj-line-strong hover:text-soj-text",
              )}
            >
              {item.label}
              <X aria-hidden className="h-3 w-3" />
              <span className="sr-only">{t("problems.removeFilter")}</span>
            </button>
          ))}
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" loading={isPending} onClick={resetFilters}>
              {t("problems.reset")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 筛选按钮。
 *
 * 选中态用中性亮面而不是强调色：这一屏的强调色要留给表格里的实时状态与链接，
 * 一排四个按钮全蓝的话，读者找不到真正的重点在哪。
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-soj-md border px-2.5 text-xs transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent",
        active
          ? "soj-inset-light border-soj-line-strong bg-soj-surface-2 text-soj-text"
          : "border-soj-line bg-soj-bg-raised/60 text-soj-muted hover:border-soj-line-strong hover:text-soj-text",
      )}
    >
      {children}
    </button>
  );
}

function ChipCount({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tabular-nums text-soj-muted">{children}</span>;
}
