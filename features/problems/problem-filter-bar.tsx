"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProblemDifficulty, ProblemStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/components/providers/i18n-provider";

type ProblemFilterBarProps = {
  query?: string;
  difficulty?: ProblemDifficulty;
  status?: ProblemStatus;
  tag?: string;
  tags: string[];
};

export function ProblemFilterBar({ query = "", difficulty, status, tag, tags }: ProblemFilterBarProps) {
  const { t, localize } = useI18n();
  const [search, setSearch] = useState(query);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficultyOptions: Array<{ value: ProblemDifficulty | "all"; label: string }> = [
    { value: "all", label: t("problems.allDifficulties") },
    { value: "easy", label: t("problems.difficulty.easy") },
    { value: "medium", label: t("problems.difficulty.medium") },
    { value: "hard", label: t("problems.difficulty.hard") },
  ];
  const statusOptions: Array<{ value: ProblemStatus | "all"; label: string }> = [
    { value: "all", label: t("problems.allStatuses") },
    { value: "todo", label: t("status.todo") },
    { value: "attempted", label: t("status.attempted") },
    { value: "accepted", label: t("status.solved") },
  ];

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

  function resetFilters() {
    setSearch("");
    startTransition(() => {
      router.replace(localize(pathname));
    });
  }

  return (
    <form
      className="soj-control-panel grid gap-4 p-4 md:p-5"
      onSubmit={submitSearch}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/35 pb-4">
        <div>
          <h2 className="text-base font-semibold text-soj-text">{t("problems.findNext")}</h2>
          <p className="mt-1 text-sm text-soj-muted">{t("problems.filtersShareable")}</p>
        </div>
        <div className="h-px w-32 soj-hairline" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(150px,176px)_minmax(140px,160px)_minmax(150px,192px)_auto] lg:items-end">
        <Input
          id="problem-search"
          label={t("problems.search")}
          name="query"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("problems.searchPlaceholder")}
        />
        <div className="grid gap-2">
          <span className="text-sm font-medium text-soj-text">{t("problems.difficulty")}</span>
          <Select value={difficulty ?? "all"} onValueChange={(value) => replaceFilter("difficulty", value)}>
            <SelectTrigger className="w-full" aria-label={t("problems.difficulty")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-soj-text">{t("problems.status")}</span>
          <Select value={status ?? "all"} onValueChange={(value) => replaceFilter("status", value)}>
            <SelectTrigger className="w-full" aria-label={t("problems.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-soj-text">{t("problems.tag")}</span>
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
        <div className="flex gap-2">
          <Button type="submit" loading={isPending} className="min-w-24">
            {t("problems.apply")}
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            {t("problems.reset")}
          </Button>
        </div>
      </div>
    </form>
  );
}
