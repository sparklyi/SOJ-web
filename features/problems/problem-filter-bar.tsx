"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { ProblemDifficulty } from "@/lib/api/types";
import { DifficultyScale } from "@/components/soj/difficulty-composition";
import { problemDifficultyLabelKey } from "@/lib/domain/problem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/ui/cn";

type ProblemFilterBarProps = {
  query?: string;
  difficulty?: ProblemDifficulty;
  tag?: string;
  tags: string[];
};

/** URL-based server filters. Tag suggestions are optional; any tag can be entered. */
export function ProblemFilterBar({ query = "", difficulty, tag = "", tags }: ProblemFilterBarProps) {
  const { t, localize } = useI18n();
  const [search, setSearch] = useState(query);
  const [tagSearch, setTagSearch] = useState(tag);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasFilters = Boolean(query || difficulty || tag);

  const activeFilters: Array<{ key: string; label: string }> = [];
  if (query) activeFilters.push({ key: "q", label: `${t("problems.search")} · ${query}` });
  if (tag) activeFilters.push({ key: "tag", label: tag });

  function replaceFilter(key: string, value: string) {
    applyFilters({ [key]: value });
  }

  function applyFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if ((key === "difficulty" && value === "all") || value.trim() === "") next.delete(key);
      else next.set(key, value.trim());
      if (key === "q") next.delete("query");
    }
    next.delete("page");
    startTransition(() => {
      router.replace(localize(next.size ? `${pathname}?${next.toString()}` : pathname));
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({ q: search, tag: tagSearch });
  }

  function clearFilter(key: string) {
    if (key === "q") setSearch("");
    if (key === "tag") setTagSearch("");
    replaceFilter(key, "");
  }

  function resetFilters() {
    setSearch("");
    setTagSearch("");
    applyFilters({ q: "", difficulty: "", tag: "" });
  }

  return (
    <div className="grid gap-3 border-b border-soj-line bg-soj-bg/35 px-4 py-3.5" aria-busy={isPending}>
      <form className="grid gap-3" onSubmit={submitSearch} aria-label={t("problems.findNext")} role="search">
        <div className={cn("grid gap-3 transition-opacity lg:grid-cols-[minmax(200px,1fr)_auto_minmax(140px,168px)_auto] lg:items-end", isPending && "pointer-events-none opacity-60")}>
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
              </FilterChip>
              {(["easy", "medium", "hard"] as const).map((value) => (
                <FilterChip
                  key={value}
                  active={difficulty === value}
                  onClick={() => replaceFilter("difficulty", difficulty === value ? "" : value)}
                >
                  <DifficultyScale difficulty={value} />
                  {t(problemDifficultyLabelKey[value])}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Input id="problem-tag" label={t("problems.tag")} list="problem-tag-suggestions" value={tagSearch} onChange={(event) => setTagSearch(event.target.value)} placeholder={t("problems.allTags")} />
            <datalist id="problem-tag-suggestions">{tags.map((item) => <option key={item} value={item} />)}</datalist>
          </div>
          <Button type="submit" variant="secondary" loading={isPending}>{t("problems.applyFilters")}</Button>
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
