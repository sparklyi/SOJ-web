import type { ProblemDifficulty, ProblemSummary } from "@/lib/api/types";

export type ProblemFilter = {
  query?: string;
  difficulty?: ProblemDifficulty;
  tag?: string;
  page?: number;
  pageSize?: number;
};

export function normalizeProblemFilter(filter: ProblemFilter = {}) {
  const requestedSize = filter.pageSize ?? 20;
  const pageSize = Number.isInteger(requestedSize) && requestedSize > 0 && requestedSize <= 100 ? requestedSize : 20;
  const requestedPage = filter.page ?? 1;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= Math.floor(2_147_483_647 / pageSize) ? requestedPage : 1;
  const difficulty = filter.difficulty && (["easy", "medium", "hard"] as const).includes(filter.difficulty) ? filter.difficulty : undefined;
  return { query: filter.query?.trim() || undefined, difficulty, tag: filter.tag?.trim() || undefined, page, pageSize };
}

export function parseProblemFilter(params: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return normalizeProblemFilter({ query: first(params.q ?? params.query), tag: first(params.tag), difficulty: first(params.difficulty) as ProblemDifficulty, page: Number(first(params.page)), pageSize: Number(first(params.page_size)) });
}

export function getAcceptanceRate(problem: Pick<ProblemSummary, "acceptedCount" | "submissionCount">) {
  if (problem.submissionCount <= 0) return 0;
  return Math.round((problem.acceptedCount / problem.submissionCount) * 1000) / 10;
}

/**
 * 难度与状态到「文案词条」的唯一映射表。
 *
 * 这里只管**词**，不管**色**——色彩属于视觉层，各有一份权威：
 *   难度三档明度（堆叠条与徽标共用一条阶梯）
 *     → components/soj/difficulty-composition.tsx
 *   状态的图标与色调 → components/soj/problem-status.tsx
 *
 * 曾经词条和色调都放在这里，而难度条又是另一份定义，结果同一个「困难」
 * 在筛选栏是蓝的、在列表里是红的：词归 domain，色归组件，互不越界。
 */
export const problemDifficultyLabelKey = {
  easy: "problems.difficulty.easy",
  medium: "problems.difficulty.medium",
  hard: "problems.difficulty.hard",
} as const;

export const problemStatusLabelKey = {
  todo: "status.todo",
  attempted: "status.attempted",
  accepted: "status.solved",
} as const;

/**
 * 可见性 → 词条 key。
 *
 * 之前这张表是审核工作区里的一行 `{selected.visibility}`（界面上直接出现
 * `public`），而作者表单里另有一份手写的 if/else，两处对同一个枚举各说各话。
 */
export const problemVisibilityLabelKey = {
  private: "authoring.visibility.private",
  public: "authoring.visibility.public",
  contest_only: "authoring.visibility.contestOnly",
} as const;

export function matchesProblemFilter(problem: ProblemSummary, filter: ProblemFilter) {
  const query = filter.query?.trim().toLowerCase();
  const matchesQuery = query ? `${problem.title} ${problem.slug}`.toLowerCase().includes(query) : true;
  const matchesDifficulty = filter.difficulty ? problem.difficulty === filter.difficulty : true;
  const matchesTag = filter.tag ? problem.tags.includes(filter.tag) : true;

  return matchesQuery && matchesDifficulty && matchesTag;
}
