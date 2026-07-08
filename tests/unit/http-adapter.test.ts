import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createHttpAdapter } from "@/lib/api/http-adapter";

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
      "http://localhost:8080/api/v1/admin/languages?page=1&page_size=100&enabled=true&engine=soj-agent",
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

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/admin/languages?page=1&page_size=100", {
      cache: "no-store",
      headers: { Authorization: "Bearer test-token" },
    });
  });
});
