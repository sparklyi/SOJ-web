import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/lib/api/client";
import { getCurrentUser } from "@/features/auth/api";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { mockUser } from "@/lib/mock/fixtures";
import { getContest, getContestArenaEvents, getContestScoreboard, listContests } from "@/features/contests/api";
import { listEnabledLanguages } from "@/features/languages/api";
import { getProblem, listProblems } from "@/features/problems/api";
import { getSubmission, listSubmissions } from "@/features/submissions/api";

const client = createApiClient({ mode: "mock" });

describe("feature api modules", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("returns anonymous state without a saved mock session", async () => {
    await expect(getCurrentUser(client)).resolves.toBeNull();
  });

  it("creates an HTTP browser client with the saved access token", async () => {
    const session = createMockSession(mockUser);
    saveSession(window.localStorage, session);
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          id: 7,
          email: "lin@example.com",
          username: "lin-chen",
          avatar_url: null,
          bio: null,
          roles: ["user"],
          permissions: ["problem.read", "submission.create", "submission.read_own", "contest.join"],
          status: "active",
          created_at: "2026-07-07T10:00:00Z",
          updated_at: "2026-07-07T10:00:00Z",
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createApiClient({ mode: "http" }).auth.me()).resolves.toMatchObject({ handle: "lin-chen" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/me", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

  });

  it("uses the saved browser session user in mock mode", async () => {
    saveSession(window.localStorage, createMockSession({ ...mockUser, handle: "saved-user", displayName: "Saved User" }));

    await expect(createApiClient({ mode: "mock" }).auth.me()).resolves.toMatchObject({
      handle: "saved-user",
      displayName: "Saved User",
    });

  });

  it("returns enabled judge languages from the language catalog", async () => {
    const languages = await listEnabledLanguages(client);
    expect(languages.items.map((language) => language.engineLanguageId)).toEqual(expect.arrayContaining(["cpp17", "go"]));
    expect(languages.items.every((language) => language.engine === "soj-agent" && language.enabled)).toBe(true);
  });

  it("filters problem lists and propagates not found errors", async () => {
    // 题目是公共资产：匿名也能读 published+public，取数不再需要会话。
    const problems = await listProblems({ difficulty: "hard" }, client);
    expect(problems.items.every((problem) => problem.difficulty === "hard")).toBe(true);
    await expect(getProblem(404, client)).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("filters problems by tag", async () => {
    const apiClient = {
      ...client,
      problems: {
        ...client.problems,
        list: vi.fn(async () => ({
          items: [
            {
              id: 1,
              slug: "alpha",
              title: "Alpha",
              difficulty: "easy" as const,
              tags: ["math"],
              status: "todo" as const,
              acceptedCount: 0,
              submissionCount: 0,
            },
            {
              id: 2,
              slug: "beta",
              title: "Beta",
              difficulty: "medium" as const,
              tags: ["dp"],
              status: "accepted" as const,
              acceptedCount: 4,
              submissionCount: 5,
            },
          ],
          total: 2,
        })),
      },
    };

    const problems = await listProblems({ tag: "math" }, apiClient);

    expect(problems.items).toHaveLength(1);
    expect(problems.items[0]?.slug).toBe("alpha");
    expect(problems.total).toBe(1);
  });

  it("returns submissions with display state", async () => {
    const submissions = await listSubmissions(client);
    expect(submissions.items[0]?.displayState.tone).toBeTruthy();

    const submission = await getSubmission(4, client);
    expect(submission.displayState.terminal).toBe(true);
  });

  it("returns contest state, scoreboard, and arena events", async () => {
    // 站点策略：比赛内容只对已登录 actor 开放，取数客户端需要带上会话。
    saveSession(window.localStorage, createMockSession(mockUser));
    const authedClient = createApiClient({ mode: "mock" });
    const contests = await listContests(authedClient);
    expect(contests.items.map((contest) => contest.phase)).toEqual(expect.arrayContaining(["open", "frozen"]));

    const contest = await getContest(1, authedClient);
    expect(contest.canSubmit).toBe(true);

    const scoreboard = await getContestScoreboard(1, authedClient);
    expect(scoreboard.rows[0]?.rank).toBe(1);

    const arena = await getContestArenaEvents(1, authedClient);
    expect(arena.length).toBeGreaterThan(1);
  });

  it("uses client contest scoreboard when the adapter implements it", async () => {
    const scoreboard = {
      type: "acm" as const,
      rows: [
        {
          rank: 1,
          id: "backend-team",
          handle: "backend-team",
          solved: 9,
          penalty: 12,
          problems: [],
        },
      ],
    };
    const apiClient = {
      ...client,
      contests: {
        ...client.contests,
        get: vi.fn(async () => ({
          id: 99,
          ownerUserId: 1,
          title: "Backend Cup",
          type: "acm" as const,
          status: "running" as const,
          startsAt: "2026-07-08T10:00:00Z",
          endsAt: "2026-07-08T12:00:00Z",
          freezeAt: "2026-07-08T11:30:00Z",
          registered: false,
          currentUserRoles: [],
          problems: [],
        })),
        register: vi.fn(),
        scoreboard: vi.fn(async () => scoreboard),
      },
    };

    await expect(getContestScoreboard(99, apiClient)).resolves.toBe(scoreboard);
    expect(apiClient.contests.scoreboard).toHaveBeenCalledWith(99);
    expect(apiClient.contests.get).not.toHaveBeenCalled();
  });
});
