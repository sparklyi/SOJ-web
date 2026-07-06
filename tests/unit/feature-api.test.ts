import { describe, expect, it } from "vitest";
import { createApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/features/auth/api";
import { getContest, getContestArenaEvents, getContestScoreboard, listContests } from "@/features/contests/api";
import { getProblem, listProblems } from "@/features/problems/api";
import { getSubmission, listSubmissions } from "@/features/submissions/api";

const client = createApiClient({ mode: "mock" });

describe("feature api modules", () => {
  it("returns current user from auth boundary", async () => {
    await expect(getCurrentUser(client)).resolves.toMatchObject({ handle: "lin-chen" });
  });

  it("filters problem lists and propagates not found errors", async () => {
    const problems = await listProblems({ difficulty: "hard" }, client);
    expect(problems.items.every((problem) => problem.difficulty === "hard")).toBe(true);
    await expect(getProblem(404, client)).rejects.toBeInstanceOf(ApiError);
  });

  it("returns submissions with display state", async () => {
    const submissions = await listSubmissions(client);
    expect(submissions.items[0]?.displayState.label).toBeTruthy();

    const submission = await getSubmission(4, client);
    expect(submission.displayState.terminal).toBe(true);
  });

  it("returns contest state, scoreboard, and arena events", async () => {
    const contests = await listContests(client);
    expect(contests.items.map((contest) => contest.phase)).toEqual(expect.arrayContaining(["open", "frozen"]));

    const contest = await getContest(1, client);
    expect(contest.canSubmit).toBe(true);

    const scoreboard = await getContestScoreboard(1, client);
    expect(scoreboard.rows[0]?.rank).toBe(1);

    const arena = await getContestArenaEvents(1, client);
    expect(arena.length).toBeGreaterThan(1);
  });
});
