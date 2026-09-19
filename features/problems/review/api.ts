import { createApiClient } from "@/lib/api/client";
import type { ApiClient, ReviewDecision } from "@/lib/api/types";

export async function listProblemReviewQueue(client: ApiClient = createApiClient()) {
  return client.problems.reviewQueue();
}

export async function listProblemReviewEvents(id: number, client: ApiClient = createApiClient()) {
  return client.problems.reviewEvents(id);
}

export async function decideProblemReview(
  id: number,
  decision: ReviewDecision,
  comment: string,
  client: ApiClient = createApiClient(),
) {
  return client.problems.decideReview(id, comment ? { decision, comment } : { decision });
}
