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
