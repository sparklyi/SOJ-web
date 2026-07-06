import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";
import { getSubmissionDisplayState, sortSubmissionsByNewest } from "@/lib/domain/submission";

export async function listSubmissions(client: ApiClient = createApiClient()) {
  const result = await client.submissions.list();
  const items = sortSubmissionsByNewest(result.items).map((submission) => ({
    ...submission,
    displayState: getSubmissionDisplayState(submission.status),
  }));

  return { items, total: items.length };
}

export async function getSubmission(id: number, client: ApiClient = createApiClient()) {
  const submission = await client.submissions.get(id);
  return {
    ...submission,
    displayState: getSubmissionDisplayState(submission.status),
  };
}
