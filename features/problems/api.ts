import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";
import type { ProblemFilter } from "@/lib/domain/problem";
import { normalizeProblemFilter } from "@/lib/domain/problem";

export async function listProblems(filter: ProblemFilter = {}, client: ApiClient = createApiClient()) {
  return client.problems.list(normalizeProblemFilter(filter));
}

export async function getProblem(id: number, client: ApiClient = createApiClient()) {
  return client.problems.get(id);
}
