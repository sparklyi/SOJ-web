import { createApiClient } from "@/lib/api/client";
import type { ApiClient, RejudgeBatchStatus } from "@/lib/api/types";

export type RejudgeTarget =
  | { kind: "problem"; problemId: number; contestId?: undefined }
  | { kind: "contest"; contestId: number; problemId?: undefined };

export async function listRejudgeBatches(
  filter: { problemId?: number; contestId?: number; status?: RejudgeBatchStatus } = {},
  client: ApiClient = createApiClient(),
) {
  return client.rejudge.list(filter);
}

export async function getRejudgeBatch(id: number, client: ApiClient = createApiClient()) {
  return client.rejudge.get(id);
}

export async function createRejudgeBatch(target: RejudgeTarget, reason: string, client: ApiClient = createApiClient()) {
  const input = target.kind === "problem" ? { problemId: target.problemId, reason } : { contestId: target.contestId, reason };
  return client.rejudge.create(input);
}

export async function cancelRejudgeBatch(id: number, reason: string, client: ApiClient = createApiClient()) {
  return client.rejudge.cancel(id, { reason });
}
