import { describe, expect, it } from "vitest";
import { mapContestResponse, mapContestScoreboard } from "@/lib/api/contest-mappers";
import { buildScoreboardModel, getScoreboardColumns } from "@/lib/domain/scoreboard";

describe("scoreboard model", () => {
  it("ranks ACM rows by solved count then penalty", () => {
    const model = buildScoreboardModel({
      type: "acm",
      rows: [
        { id: "a", handle: "alpha", solved: 2, penalty: 180, problems: [] },
        { id: "b", handle: "beta", solved: 2, penalty: 120, problems: [] },
      ],
    });

    expect(model.rows.map((row) => row.handle)).toEqual(["beta", "alpha"]);
  });

  it("ranks OI rows by score then latest improvement", () => {
    const model = buildScoreboardModel({
      type: "oi",
      rows: [
        { id: "a", handle: "alpha", score: 240, lastImprovedAt: "2026-07-07T10:03:00Z", problems: [] },
        { id: "b", handle: "beta", score: 260, lastImprovedAt: "2026-07-07T10:01:00Z", problems: [] },
      ],
    });

    expect(model.rows[0]?.handle).toBe("beta");
  });

  it("keeps tied rows on the same rank", () => {
    const model = buildScoreboardModel({
      type: "acm",
      rows: [
        { id: "a", handle: "alpha", solved: 3, penalty: 210, problems: [] },
        { id: "b", handle: "beta", solved: 3, penalty: 210, problems: [] },
        { id: "c", handle: "cyra", solved: 2, penalty: 120, problems: [] },
      ],
    });

    expect(model.rows.map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it("exposes contest type specific columns", () => {
    expect(getScoreboardColumns("acm")).toContain("Penalty");
    expect(getScoreboardColumns("oi")).toContain("Score");
  });

  it("maps backend contest lifecycle and timestamps safely", () => {
    const now = new Date("2026-07-08T10:30:00Z");

    expect(mapContestResponse(contestResponse({ status: "published", startAt: "2026-07-08T11:00:00Z" }), now).status).toBe(
      "scheduled",
    );
    expect(mapContestResponse(contestResponse({ status: "running", freezeAt: "2026-07-08T10:00:00Z" }), now).status).toBe(
      "frozen",
    );
    expect(mapContestResponse(contestResponse({ status: "running", freezeAt: "2026-07-08T11:00:00Z" }), now).status).toBe(
      "running",
    );
    expect(mapContestResponse(contestResponse({ status: "ended" }), now).status).toBe("ended");
    expect(mapContestResponse(contestResponse({ status: "archived" }), now).status).toBe("unsealed");
    expect(mapContestResponse(contestResponse({ status: "draft" }), now).status).toBe("ended");
  });

  it("maps contest problems with backend aliases and placeholder titles", () => {
    const contest = mapContestResponse(
      contestResponse({
        problems: [
          { problem_id: 202, alias: "B", sort_order: 2 },
          { problem_id: 101, alias: "A", sort_order: 1 },
        ],
      }),
    );

    expect(contest.type).toBe("acm");
    expect(contest.registered).toBe(false);
    expect(contest.problems).toEqual([
      { problemId: 101, alias: "A", title: "Problem A" },
      { problemId: 202, alias: "B", title: "Problem B" },
    ]);
  });

  it("maps backend ACM scoreboard rows into the existing scoreboard model shape", () => {
    const model = mapContestScoreboard({
      contest_id: 1,
      view: "frozen",
      generated_at: "2026-07-08T10:30:00Z",
      problems: [
        { problem_id: 101, alias: "A", sort_order: 1 },
        { problem_id: 102, alias: "B", sort_order: 2 },
      ],
      rows: [
        {
          rank: 2,
          user_id: 7,
          display_name: "lin",
          accepted_count: 1,
          penalty_minutes: 42,
          cells: [
            {
              problem_id: 101,
              alias: "A",
              status: "accepted",
              attempts: 2,
              penalty_minutes: 42,
              accepted_at: "2026-07-08T10:12:00Z",
            },
            {
              problem_id: 102,
              alias: "B",
              status: "frozen",
              attempts: 1,
              frozen_attempts: 1,
              penalty_minutes: 0,
            },
          ],
        },
      ],
    });

    expect(model).toEqual({
      type: "acm",
      rows: [
        {
          id: "7",
          handle: "lin",
          rank: 2,
          solved: 1,
          penalty: 42,
          problems: [
            { problemId: 101, alias: "A", status: "accepted", attempts: 2, penalty: 42 },
            { problemId: 102, alias: "B", status: "pending", attempts: 1, penalty: 0 },
          ],
        },
      ],
    });
  });
});

function contestResponse(overrides: {
  status?: "draft" | "published" | "running" | "ended" | "archived";
  startAt?: string;
  endAt?: string;
  freezeAt?: string;
  problems?: Array<{ problem_id: number; alias: string; sort_order: number }>;
} = {}) {
  return {
    id: 1,
    owner_user_id: 7,
    title: "Signal Cup",
    description: null,
    visibility: "public" as const,
    status: overrides.status ?? "published",
    start_at: overrides.startAt ?? "2026-07-08T10:00:00Z",
    end_at: overrides.endAt ?? "2026-07-08T12:00:00Z",
    freeze_at: overrides.freezeAt ?? "2026-07-08T11:30:00Z",
    problems: overrides.problems ?? [{ problem_id: 101, alias: "A", sort_order: 1 }],
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-07T10:00:00Z",
  };
}
