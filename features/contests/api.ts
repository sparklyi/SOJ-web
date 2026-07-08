import { createApiClient } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api/types";
import { buildArenaEvents } from "@/lib/domain/arena";
import { canRegister, canSubmit, getContestPhase } from "@/lib/domain/contest";
import { sortSubmissionsByNewest } from "@/lib/domain/submission";

export async function listContests(client: ApiClient = createApiClient()) {
  const result = await client.contests.list();
  const items = result.items.map((contest) => ({
    ...contest,
    phase: getContestPhase(contest),
    canRegister: canRegister(contest),
    canSubmit: canSubmit(contest),
  }));

  return { items, total: items.length };
}

export async function getContest(id: number, client: ApiClient = createApiClient()) {
  const contest = await client.contests.get(id);
  return {
    ...contest,
    phase: getContestPhase(contest),
    canRegister: canRegister(contest),
    canSubmit: canSubmit(contest),
  };
}

export async function getContestScoreboard(id: number, client: ApiClient = createApiClient()) {
  return client.contests.scoreboard(id);
}

export async function getContestArenaEvents(id: number, client: ApiClient = createApiClient()) {
  const contest = await client.contests.get(id);
  const submissions = await client.submissions.list();
  return buildArenaEvents(
    contest,
    sortSubmissionsByNewest(submissions.items.filter((submission) => submission.contestId === id)),
  );
}
