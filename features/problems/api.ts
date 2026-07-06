import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";
import type { ProblemFilter } from "@/lib/domain/problem";
import { matchesProblemFilter } from "@/lib/domain/problem";

export async function listProblems(filter: ProblemFilter = {}, client: ApiClient = createApiClient()) {
  const result = await client.problems.list();
  const items = result.items.filter((problem) => matchesProblemFilter(problem, filter));
  return { items, total: items.length };
}

export async function getProblem(id: number, client: ApiClient = createApiClient()) {
  return client.problems.get(id);
}
