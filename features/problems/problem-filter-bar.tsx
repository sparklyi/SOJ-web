"use client";

import { FormEvent, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProblemDifficulty, ProblemStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const difficultyOptions: Array<{ value: ProblemDifficulty | "all"; label: string }> = [
  { value: "all", label: "All difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const statusOptions: Array<{ value: ProblemStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "todo", label: "Todo" },
  { value: "attempted", label: "Attempted" },
  { value: "accepted", label: "Solved" },
];

type ProblemFilterBarProps = {
  query?: string;
  difficulty?: ProblemDifficulty;
  status?: ProblemStatus;
  tag?: string;
  tags: string[];
};

export function ProblemFilterBar({ query = "", difficulty, status, tag, tags }: ProblemFilterBarProps) {
  const [search, setSearch] = useState(query);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function replaceFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all" || value.trim() === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.replace(next.size ? `${pathname}?${next.toString()}` : pathname);
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceFilter("q", search);
  }

  function resetFilters() {
    setSearch("");
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <form
      className="soj-control-panel grid gap-4 p-4 md:p-5"
      onSubmit={submitSearch}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soj-line/35 pb-4">
        <div>
          <h2 className="text-base font-semibold text-soj-text">Find the next problem</h2>
          <p className="mt-1 text-sm text-soj-muted">Filters update the URL so review links stay shareable.</p>
        </div>
        <div className="h-px w-32 soj-hairline" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(150px,176px)_minmax(140px,160px)_minmax(150px,192px)_auto] lg:items-end">
        <Input
          id="problem-search"
          label="Search problems"
          name="query"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Title, slug, or tag"
        />
        <div className="grid gap-2">
          <span className="text-sm font-medium text-soj-text">Difficulty</span>
          <Select value={difficulty ?? "all"} onValueChange={(value) => replaceFilter("difficulty", value)}>
            <SelectTrigger className="w-full" aria-label="Difficulty">
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
          <span className="text-sm font-medium text-soj-text">Status</span>
          <Select value={status ?? "all"} onValueChange={(value) => replaceFilter("status", value)}>
            <SelectTrigger className="w-full" aria-label="Status">
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
          <span className="text-sm font-medium text-soj-text">Tag</span>
          <Select value={tag ?? "all"} onValueChange={(value) => replaceFilter("tag", value)}>
            <SelectTrigger className="w-full" aria-label="Tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
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
            Apply
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
