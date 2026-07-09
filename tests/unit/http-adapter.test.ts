import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createHttpAdapter } from "@/lib/api/http-adapter";
import { request } from "@/lib/api/http-client";

describe("http adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from a successful backend envelope through languages.list", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          items: [
            {
              id: 60,
              engine: "soj-agent",
              engine_language_id: "go",
              name: "Go",
              version: "1.24",
              compile_command: "go build -o {{binary}} {{source}}",
              run_command: "{{binary}}",
              default_time_limit_ms: 1000,
              default_memory_limit_kb: 262144,
              enabled: true,
            },
          ],
          total: 1,
          page: 1,
          page_size: 100,
        },
        error: null,
        request_id: "req-test",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const languages = await createHttpAdapter().languages.list({ enabled: true, engine: "soj-agent" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/languages?page=1&page_size=100&enabled=true&engine=soj-agent",
      { cache: "no-store" },
    );
    expect(languages).toEqual({
      items: [
        {
          id: 60,
          engine: "soj-agent",
          engineLanguageId: "go",
          name: "Go",
          version: "1.24",
          compileCommand: "go build -o {{binary}} {{source}}",
          runCommand: "{{binary}}",
          defaultTimeLimitMs: 1000,
          defaultMemoryLimitKb: 262144,
          enabled: true,
        },
      ],
      total: 1,
    });
  });

  it("maps a backend problem page with per-item stats to problem summaries", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const path = String(url).replace("http://localhost:8080", "");
      if (path === "/api/v1/problems?page=1&page_size=100") {
        return Response.json({
          data: {
            items: [
              problemResponse({
                id: 101,
                slug: "two-sum",
                title: "Two Sum",
                difficulty: "easy",
                status: "published",
                tags: ["array", "hash-table"],
                timeLimitMs: 1500,
                memoryLimitKb: 131072,
              }),
              problemResponse({
                id: 102,
                slug: "knapsack",
                title: "Knapsack",
                difficulty: "medium",
                status: "published",
                tags: ["dp"],
              }),
            ],
            total: 2,
            page: 1,
            page_size: 100,
          },
          error: null,
        });
      }
      if (path === "/api/v1/problems/101/stats") {
        return Response.json({
          data: problemStatsResponse({ problemId: 101, totalSubmissions: 20, acceptedSubmissions: 12 }),
          error: null,
        });
      }
      if (path === "/api/v1/problems/102/stats") {
        return Response.json({
          data: problemStatsResponse({ problemId: 102, totalSubmissions: 8, acceptedSubmissions: 3 }),
          error: null,
        });
      }
      return Response.json({ data: null, error: { code: "not_found", message: "missing mock" } }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const problems = await createHttpAdapter().problems.list();

    expect(requestedUrls(fetchMock)).toEqual(
      expect.arrayContaining([
        "http://localhost:8080/api/v1/problems?page=1&page_size=100",
        "http://localhost:8080/api/v1/problems/101/stats",
        "http://localhost:8080/api/v1/problems/102/stats",
      ]),
    );
    expect(problems).toEqual({
      items: [
        {
          id: 101,
          slug: "two-sum",
          title: "Two Sum",
          difficulty: "easy",
          tags: ["array", "hash-table"],
          status: "todo",
          acceptedCount: 12,
          submissionCount: 20,
        },
        {
          id: 102,
          slug: "knapsack",
          title: "Knapsack",
          difficulty: "medium",
          tags: ["dp"],
          status: "todo",
          acceptedCount: 3,
          submissionCount: 8,
        },
      ],
      total: 2,
    });
  });

  it("propagates typed ApiError when a problem list stats request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const path = String(url).replace("http://localhost:8080", "");
        if (path === "/api/v1/problems?page=1&page_size=100") {
          return Response.json({
            data: {
              items: [
                problemResponse({
                  id: 101,
                  slug: "two-sum",
                  title: "Two Sum",
                  difficulty: "easy",
                  status: "published",
                }),
              ],
              total: 1,
              page: 1,
              page_size: 100,
            },
            error: null,
          });
        }
        return Response.json(
          {
            data: null,
            error: { code: "problem.stats_unavailable", message: "Problem stats unavailable." },
          },
          { status: 503 },
        );
      }),
    );

    await expect(createHttpAdapter().problems.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "problem.stats_unavailable",
      message: "Problem stats unavailable.",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("does not reuse backend publication status as solve status in HTTP mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const path = String(url).replace("http://localhost:8080", "");
        if (path === "/api/v1/problems?page=1&page_size=100") {
          return Response.json({
            data: {
              items: [
                problemResponse({ id: 102, slug: "draft-problem", title: "Draft Problem", difficulty: "medium", status: "draft" }),
                problemResponse({ id: 103, slug: "archived-problem", title: "Archived Problem", difficulty: "hard", status: "archived" }),
              ],
              total: 2,
              page: 1,
              page_size: 100,
            },
            error: null,
          });
        }
        if (path === "/api/v1/problems/102/stats") {
          return Response.json({ data: problemStatsResponse({ problemId: 102 }), error: null });
        }
        if (path === "/api/v1/problems/103/stats") {
          return Response.json({ data: problemStatsResponse({ problemId: 103 }), error: null });
        }
        return Response.json({ data: null, error: { code: "not_found", message: "missing mock" } }, { status: 404 });
      }),
    );

    const problems = await createHttpAdapter().problems.list();

    expect(problems.items.map((problem) => problem.status)).toEqual(["todo", "todo"]);
  });

  it("maps a backend submission page to submission summaries", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          items: [
            submissionResponse({
              id: 501,
              problemId: 101,
              contestId: 7,
              status: "time_limit",
              score: 40,
              timeMs: 1001,
              memoryKb: 65536,
            }),
            submissionResponse({
              id: 502,
              problemId: 102,
              contestId: null,
              status: "memory_limit",
              score: 0,
              timeMs: null,
              memoryKb: null,
            }),
          ],
          total: 2,
          page: 1,
          page_size: 100,
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const submissions = await createHttpAdapter().submissions.list();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/submissions?page=1&page_size=100", { cache: "no-store" });
    expect(submissions).toEqual({
      items: [
        {
          id: 501,
          problemId: 101,
          problemTitle: "Problem #101",
          contestId: 7,
          status: "time_limit",
          score: 40,
          timeMs: 1001,
          memoryKb: 65536,
          submittedAt: "2026-07-07T10:12:00Z",
        },
        {
          id: 502,
          problemId: 102,
          problemTitle: "Problem #102",
          contestId: undefined,
          status: "memory_limit",
          score: 0,
          timeMs: undefined,
          memoryKb: undefined,
          submittedAt: "2026-07-07T10:12:00Z",
        },
      ],
      total: 2,
    });
  });

  it("creates a submission with backend field names and maps the response", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          data: submissionResponse({
            id: 601,
            problemId: 101,
            contestId: 7,
            status: "queued",
            score: 0,
          }),
          error: null,
        },
        { status: 202 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const submission = await createHttpAdapter({ accessToken: "submit-token" }).submissions.create({
      problemId: 101,
      contestId: 7,
      languageId: 54,
      sourceCode: "int main() { return 0; }",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/submissions", {
      cache: "no-store",
      method: "POST",
      headers: {
        Authorization: "Bearer submit-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        problem_id: 101,
        contest_id: 7,
        language_id: 54,
        source_code: "int main() { return 0; }",
      }),
    });
    expect(submission).toMatchObject({
      id: 601,
      problemId: 101,
      problemTitle: "Problem #101",
      contestId: 7,
      status: "queued",
      submittedAt: "2026-07-07T10:12:00Z",
    });
  });

  it("creates and gets runs with backend field names and mapped output fields", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const path = String(url).replace("http://localhost:8080", "");
      if (path === "/api/v1/runs") {
        return Response.json(
          {
            data: runResponse({
              id: 701,
              problemId: 101,
              languageId: 54,
              status: "running",
              stdout: null,
              stderr: null,
              compileOutput: null,
              timeMs: null,
              memoryKb: null,
            }),
            error: null,
          },
          { status: 202 },
        );
      }
      if (path === "/api/v1/runs/701") {
        return Response.json({
          data: runResponse({
            id: 701,
            problemId: 101,
            languageId: 54,
            status: "accepted",
            stdout: "42\n",
            stderr: "",
            compileOutput: "",
            timeMs: 38,
            memoryKb: 8192,
          }),
          error: null,
        });
      }
      return Response.json({ data: null, error: { code: "not_found", message: "missing mock" } }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpAdapter({ accessToken: "run-token" });
    const created = await client.runs.create({
      problemId: 101,
      languageId: 54,
      sourceCode: "int main() { return 0; }",
      stdin: "input\n",
    });
    const completed = await client.runs.get(701);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/v1/runs", {
      cache: "no-store",
      method: "POST",
      headers: {
        Authorization: "Bearer run-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        problem_id: 101,
        language_id: 54,
        source_code: "int main() { return 0; }",
        stdin: "input\n",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/runs/701", {
      cache: "no-store",
      headers: { Authorization: "Bearer run-token" },
    });
    expect(created).toMatchObject({
      id: 701,
      problemId: 101,
      languageId: 54,
      status: "running",
      stdout: undefined,
      timeMs: undefined,
      createdAt: "2026-07-07T10:12:00Z",
    });
    expect(completed).toMatchObject({
      id: 701,
      status: "accepted",
      stdout: "42\n",
      stderr: "",
      compileOutput: "",
      timeMs: 38,
      memoryKb: 8192,
      finishedAt: "2026-07-07T10:12:03Z",
    });
  });

  it("lists and gets contests from backend contest endpoints", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const path = String(url).replace("http://localhost:8080", "");
      if (path === "/api/v1/contests?page=1&page_size=100") {
        return Response.json({
          data: {
            items: [
              contestResponse({
                id: 11,
                title: "Signal Cup",
                status: "published",
                registered: true,
                startAt: "2999-07-08T11:00:00Z",
                problems: [{ problem_id: 101, alias: "A", sort_order: 1, title: "Two Sum" }],
              }),
            ],
            total: 1,
            page: 1,
            page_size: 100,
          },
          error: null,
        });
      }
      if (path === "/api/v1/contests/11") {
        return Response.json({
          data: contestResponse({
            id: 11,
            title: "Signal Cup",
            status: "running",
            endAt: "2999-07-08T12:00:00Z",
            freezeAt: "2000-07-08T09:00:00Z",
            problems: [{ problem_id: 202, alias: "B", sort_order: 2 }],
          }),
          error: null,
        });
      }
      return Response.json({ data: null, error: { code: "not_found", message: "missing mock" } }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpAdapter({ accessToken: "contest-token" });
    const contests = await client.contests.list();
    const contest = await client.contests.get(11);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/v1/contests?page=1&page_size=100", {
      cache: "no-store",
      headers: { Authorization: "Bearer contest-token" },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/contests/11", {
      cache: "no-store",
      headers: { Authorization: "Bearer contest-token" },
    });
    expect(contests.items[0]).toMatchObject({
      id: 11,
      title: "Signal Cup",
      type: "acm",
      status: "scheduled",
      registered: true,
      problems: [{ problemId: 101, alias: "A", title: "Two Sum" }],
    });
    expect(contest).toMatchObject({
      id: 11,
      status: "frozen",
      problems: [{ problemId: 202, alias: "B", title: "Problem B" }],
    });
  });

  it("registers for a contest with backend field names", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          data: {
            id: 301,
            contest_id: 11,
            user_id: 7,
            display_name: "Lin",
            email: "lin@example.com",
            status: "active",
            registered_at: "2026-07-08T10:10:00Z",
          },
          error: null,
        },
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const registration = await createHttpAdapter({ accessToken: "contest-token" }).contests.register(11, {
      displayName: "Lin",
      email: "lin@example.com",
      inviteCode: "INVITE-7",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/contests/11/registrations", {
      cache: "no-store",
      method: "POST",
      headers: {
        Authorization: "Bearer contest-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        display_name: "Lin",
        email: "lin@example.com",
        invite_code: "INVITE-7",
      }),
    });
    expect(registration).toEqual({
      id: 301,
      contestId: 11,
      userId: 7,
      displayName: "Lin",
      email: "lin@example.com",
      status: "active",
      registeredAt: "2026-07-08T10:10:00Z",
    });
  });

  it("omits invite_code when contest registration has no invite code", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          id: 302,
          contest_id: 11,
          user_id: 7,
          display_name: "Lin",
          email: "lin@example.com",
          status: "active",
          registered_at: "2026-07-08T10:10:00Z",
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createHttpAdapter().contests.register(11, {
      displayName: "Lin",
      email: "lin@example.com",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/contests/11/registrations", {
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        display_name: "Lin",
        email: "lin@example.com",
      }),
    });
  });

  it("loads backend ACM scoreboard rows through contests.scoreboard", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: scoreboardResponse(),
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const scoreboard = await createHttpAdapter({ accessToken: "contest-token" }).contests.scoreboard(11);

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/contests/11/scoreboard", {
      cache: "no-store",
      headers: { Authorization: "Bearer contest-token" },
    });
    expect(scoreboard).toMatchObject({
      type: "acm",
      rows: [
        {
          rank: 1,
          id: "7",
          handle: "Lin",
          solved: 2,
          penalty: 88,
          problems: [
            { problemId: 101, alias: "A", status: "accepted", attempts: 1, penalty: 18 },
            { problemId: 102, alias: "B", status: "wrong_answer", attempts: 2, penalty: 0 },
          ],
        },
      ],
    });
  });

  it("combines backend problem, statement, and stats into a problem detail", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const path = String(url).replace("http://localhost:8080", "");
      if (path === "/api/v1/problems/101") {
        return Response.json({
          data: problemResponse({
              id: 101,
              slug: "two-sum",
              title: "Two Sum",
              difficulty: "easy",
              status: "published",
              tags: ["array", "hash-table"],
              timeLimitMs: 1500,
              memoryLimitKb: 131072,
            }),
          error: null,
        });
      }
      if (path === "/api/v1/problems/101/statement") {
        return Response.json({
          data: {
            title: "Two Sum",
            description: "Find two values with the target sum.",
            input_description: "The first line contains n and target.",
            output_description: "Print two indices.",
            samples: [{ input: "4 9\n2 7 11 15", output: "1 2", explanation: "2 + 7 = 9" }],
            hint: null,
            source: null,
            problem_id: 101,
            version: 3,
            created_at: "2026-07-07T10:00:00Z",
          },
          error: null,
        });
      }
      if (path === "/api/v1/problems/101/stats") {
        return Response.json({
          data: problemStatsResponse({ problemId: 101, totalSubmissions: 20, acceptedSubmissions: 12 }),
          error: null,
        });
      }
      return Response.json({ data: null, error: { code: "not_found", message: "missing mock" } }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const problem = await createHttpAdapter().problems.get(101);

    expect(requestedUrls(fetchMock)).toEqual(
      expect.arrayContaining([
        "http://localhost:8080/api/v1/problems/101",
        "http://localhost:8080/api/v1/problems/101/statement",
        "http://localhost:8080/api/v1/problems/101/stats",
      ]),
    );
    expect(problem).toMatchObject({
      id: 101,
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy",
      tags: ["array", "hash-table"],
      status: "todo",
      acceptedCount: 12,
      submissionCount: 20,
      statement: "Find two values with the target sum.",
      input: "The first line contains n and target.",
      output: "Print two indices.",
      examples: [{ input: "4 9\n2 7 11 15", output: "1 2" }],
      timeLimitMs: 1500,
      memoryLimitKb: 131072,
    });
  });

  it("propagates typed ApiError when a problem detail statement request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const path = String(url).replace("http://localhost:8080", "");
        if (path === "/api/v1/problems/101") {
          return Response.json({
            data: problemResponse({ id: 101, slug: "two-sum", title: "Two Sum", difficulty: "easy", status: "published" }),
            error: null,
          });
        }
        if (path === "/api/v1/problems/101/stats") {
          return Response.json({ data: problemStatsResponse({ problemId: 101 }), error: null });
        }
        return Response.json(
          {
            data: null,
            error: { code: "problem.statement_not_found", message: "Problem statement not found." },
          },
          { status: 404 },
        );
      }),
    );

    await expect(createHttpAdapter().problems.get(101)).rejects.toMatchObject({
      name: "ApiError",
      code: "problem.statement_not_found",
      message: "Problem statement not found.",
      status: 404,
    } satisfies Partial<ApiError>);
  });

  it("propagates typed ApiError when a problem detail stats request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request) => {
        const path = String(url).replace("http://localhost:8080", "");
        if (path === "/api/v1/problems/101") {
          return Response.json({
            data: problemResponse({ id: 101, slug: "two-sum", title: "Two Sum", difficulty: "easy", status: "published" }),
            error: null,
          });
        }
        if (path === "/api/v1/problems/101/statement") {
          return Response.json({
            data: problemStatementResponse({ problemId: 101 }),
            error: null,
          });
        }
        return Response.json(
          {
            data: null,
            error: { code: "problem.stats_unavailable", message: "Problem stats unavailable." },
          },
          { status: 503 },
        );
      }),
    );

    await expect(createHttpAdapter().problems.get(101)).rejects.toMatchObject({
      name: "ApiError",
      code: "problem.stats_unavailable",
      message: "Problem stats unavailable.",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("throws ApiError with backend error code, message, and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            data: null,
            error: { code: "auth.forbidden", message: "Admin access is required." },
          },
          { status: 403 },
        ),
      ),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "auth.forbidden",
      message: "Admin access is required.",
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("throws ApiError when a successful backend envelope is missing data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          error: null,
        }),
      ),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "api.invalid_response",
      status: 200,
    } satisfies Partial<ApiError>);
  });

  it("throws ApiError when the backend returns non-JSON content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("service unavailable", { status: 503, headers: { "content-type": "text/plain" } })),
    );

    await expect(createHttpAdapter().languages.list()).rejects.toMatchObject({
      name: "ApiError",
      code: "api.invalid_response",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("allows callers to receive undefined from an empty successful response", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request<undefined>("/api/v1/auth/logout")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/logout", { cache: "no-store" });
  });

  it("adds a bearer authorization header when an access token is provided", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          items: [],
          total: 0,
          page: 1,
          page_size: 100,
        },
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createHttpAdapter({ accessToken: "test-token" }).languages.list();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/languages?page=1&page_size=100", {
      cache: "no-store",
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("logs in and maps backend username to current user identity", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: authResponse({ id: 7, username: "ada" }),
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const session = await createHttpAdapter().auth.login({ email: "ada@example.com", password: "secret" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/login", {
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ada@example.com", password: "secret" }),
    });
    expect(session).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: 7, handle: "ada", displayName: "ada", role: "user" },
    });
    expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
  });

  it("registers and maps backend username to current user identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: authResponse({ id: 8, username: "grace" }),
          error: null,
        }),
      ),
    );

    const session = await createHttpAdapter().auth.register({
      email: "grace@example.com",
      username: "grace",
      password: "secret",
    });

    expect(session.user).toEqual({ id: 8, handle: "grace", displayName: "grace", role: "user" });
  });

  it("refreshes a session with the supplied refresh token", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: authResponse({ id: 9, username: "alan" }),
        error: null,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const session = await createHttpAdapter().auth.refresh({ refreshToken: "old-refresh" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/refresh", {
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: "old-refresh" }),
    });
    expect(session.refreshToken).toBe("refresh-token");
    expect(session.user.handle).toBe("alan");
  });

  it("loads the current user from /me", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: userResponse({ id: 10, username: "lin" }),
          error: null,
        }),
      ),
    );

    await expect(createHttpAdapter({ accessToken: "access-token" }).auth.me()).resolves.toEqual({
      id: 10,
      handle: "lin",
      displayName: "lin",
      role: "user",
    });
  });

  it("returns null when /me responds with 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            data: null,
            error: { code: "auth.unauthorized", message: "Unauthorized." },
          },
          { status: 401 },
        ),
      ),
    );

    await expect(createHttpAdapter({ accessToken: "expired" }).auth.me()).resolves.toBeNull();
  });

  it("logs out with an empty 204 success response", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createHttpAdapter({ accessToken: "access-token" }).auth.logout({ refreshToken: "refresh-token" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/logout", {
      cache: "no-store",
      method: "POST",
      headers: { Authorization: "Bearer access-token" },
    });
  });
});

function authResponse(overrides: { id: number; username: string }) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    user: userResponse(overrides),
  };
}

function userResponse(overrides: { id: number; username: string }) {
  return {
    id: overrides.id,
    email: `${overrides.username}@example.com`,
    username: overrides.username,
    avatar_url: null,
    bio: null,
    role: "user",
    status: "active",
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-07T10:00:00Z",
  };
}

function problemResponse(overrides: {
  id: number;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: "draft" | "published" | "archived";
  tags?: string[];
  timeLimitMs?: number;
  memoryLimitKb?: number;
}) {
  return {
    id: overrides.id,
    title: overrides.title,
    slug: overrides.slug,
    difficulty: overrides.difficulty,
    visibility: "public",
    status: overrides.status,
    tags: overrides.tags ?? [],
    limits: {
      time_limit_ms: overrides.timeLimitMs ?? 1000,
      memory_limit_kb: overrides.memoryLimitKb ?? 262144,
    },
    owner_user_id: 1,
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-07T10:00:00Z",
    published_at: overrides.status === "published" ? "2026-07-07T10:00:00Z" : null,
  };
}

function problemStatementResponse(overrides: { problemId: number }) {
  return {
    title: "Two Sum",
    description: "Find two values with the target sum.",
    input_description: "The first line contains n and target.",
    output_description: "Print two indices.",
    samples: [{ input: "4 9\n2 7 11 15", output: "1 2" }],
    hint: null,
    source: null,
    problem_id: overrides.problemId,
    version: 3,
    created_at: "2026-07-07T10:00:00Z",
  };
}

function problemStatsResponse(overrides: { problemId: number; totalSubmissions?: number; acceptedSubmissions?: number }) {
  return {
    problem_id: overrides.problemId,
    total_submissions: overrides.totalSubmissions ?? 0,
    accepted_submissions: overrides.acceptedSubmissions ?? 0,
    status_counts: {},
  };
}

function submissionResponse(overrides: {
  id: number;
  problemId: number;
  contestId?: number | null;
  status: "queued" | "running" | "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit" | "memory_limit" | "system_error" | "canceled";
  score: number;
  timeMs?: number | null;
  memoryKb?: number | null;
}) {
  return {
    id: overrides.id,
    user_id: 7,
    problem_id: overrides.problemId,
    contest_id: overrides.contestId ?? null,
    language_id: 54,
    status: overrides.status,
    score: overrides.score,
    time_ms: overrides.timeMs ?? null,
    memory_kb: overrides.memoryKb ?? null,
    error_message: null,
    submitted_at: "2026-07-07T10:12:00Z",
    judged_at: null,
    updated_at: "2026-07-07T10:12:00Z",
  };
}

function runResponse(overrides: {
  id: number;
  problemId: number;
  languageId: number;
  status: "queued" | "running" | "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit" | "memory_limit" | "system_error" | "canceled";
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  errorMessage?: string | null;
  timeMs?: number | null;
  memoryKb?: number | null;
}) {
  return {
    id: overrides.id,
    user_id: 7,
    problem_id: overrides.problemId,
    language_id: overrides.languageId,
    status: overrides.status,
    stdout: overrides.stdout ?? null,
    stderr: overrides.stderr ?? null,
    compile_output: overrides.compileOutput ?? null,
    time_ms: overrides.timeMs ?? null,
    memory_kb: overrides.memoryKb ?? null,
    error_message: overrides.errorMessage ?? null,
    created_at: "2026-07-07T10:12:00Z",
    finished_at: overrides.status === "accepted" ? "2026-07-07T10:12:03Z" : null,
    updated_at: "2026-07-07T10:12:03Z",
  };
}

function contestResponse(overrides: {
  id: number;
  title: string;
  status: "draft" | "published" | "running" | "ended" | "archived";
  registered?: boolean;
  startAt?: string;
  endAt?: string;
  freezeAt?: string;
  problems?: Array<{ problem_id: number; alias: string; sort_order: number; title?: string }>;
}) {
  return {
    id: overrides.id,
    owner_user_id: 7,
    title: overrides.title,
    description: null,
    visibility: "public",
    status: overrides.status,
    scoring_mode: "acm" as const,
    registered: overrides.registered ?? false,
    start_at: overrides.startAt ?? "2026-07-08T10:00:00Z",
    end_at: overrides.endAt ?? "2026-07-08T12:00:00Z",
    freeze_at: overrides.freezeAt ?? "2026-07-08T11:30:00Z",
    problems: overrides.problems ?? [],
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-07T10:00:00Z",
  };
}

function scoreboardResponse() {
  return {
    contest_id: 11,
    view: "live",
    generated_at: "2026-07-08T10:30:00Z",
    problems: [
      { problem_id: 101, alias: "A", sort_order: 1 },
      { problem_id: 102, alias: "B", sort_order: 2 },
    ],
    rows: [
      {
        rank: 1,
        user_id: 7,
        display_name: "Lin",
        accepted_count: 2,
        penalty_minutes: 88,
        cells: [
          {
            problem_id: 101,
            alias: "A",
            status: "accepted",
            attempts: 1,
            penalty_minutes: 18,
            accepted_at: "2026-07-08T10:12:00Z",
          },
          {
            problem_id: 102,
            alias: "B",
            status: "attempted",
            attempts: 2,
            penalty_minutes: 0,
          },
        ],
      },
    ],
  };
}

function requestedUrls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([url]) => String(url));
}
