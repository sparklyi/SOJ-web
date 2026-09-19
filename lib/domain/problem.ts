import type { ProblemDetail, ProblemDifficulty, ProblemStatus, ProblemSummary } from "@/lib/api/types";

export type ProblemFilter = {
  query?: string;
  difficulty?: ProblemDifficulty;
  status?: ProblemStatus;
  tag?: string;
};

export function getAcceptanceRate(problem: Pick<ProblemSummary, "acceptedCount" | "submissionCount">) {
  if (problem.submissionCount <= 0) return 0;
  return Math.round((problem.acceptedCount / problem.submissionCount) * 1000) / 10;
}

/**
 * 难度与状态到「标签色 / 文案词条」的唯一映射表。
 *
 * 列表行、详情页头、提交侧栏都要显示同一组语义，映射散落在各组件里
 * 迟早会出现「列表里困难是红的、详情里是黄的」。所以集中在这里，
 * 所有展示点只消费这一份定义。
 */
export const problemDifficultyLabelKey = {
  easy: "problems.difficulty.easy",
  medium: "problems.difficulty.medium",
  hard: "problems.difficulty.hard",
} as const;

export const problemDifficultyTone = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

export const problemStatusLabelKey = {
  todo: "status.todo",
  attempted: "status.attempted",
  accepted: "status.solved",
} as const;

export const problemStatusTone = {
  todo: "neutral",
  attempted: "warning",
  accepted: "success",
} as const;

export function matchesProblemFilter(problem: ProblemSummary, filter: ProblemFilter) {
  const query = filter.query?.trim().toLowerCase();
  const matchesQuery = query ? `${problem.title} ${problem.slug} ${problem.tags.join(" ")}`.toLowerCase().includes(query) : true;
  const matchesDifficulty = filter.difficulty ? problem.difficulty === filter.difficulty : true;
  const matchesStatus = filter.status ? problem.status === filter.status : true;
  const matchesTag = filter.tag ? problem.tags.includes(filter.tag) : true;

  return matchesQuery && matchesDifficulty && matchesStatus && matchesTag;
}

export function summarizeProblem(problem: ProblemDetail): ProblemSummary {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags,
    status: problem.status,
    acceptedCount: problem.acceptedCount,
    submissionCount: problem.submissionCount,
  };
}
