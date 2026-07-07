import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpAdapter } from "@/lib/api/http-adapter";

describe("http adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads judge languages from the backend language catalog", async () => {
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
});
