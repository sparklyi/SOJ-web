import { afterEach, describe, expect, it, vi } from "vitest";
import { isNotFoundError } from "@/lib/api/errors";
import { apiBaseUrl, buildQuery, request } from "@/lib/api/http-client";

describe("http client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps the test default pointed at the backend origin", () => {
    expect(apiBaseUrl()).toBe("http://localhost:8080");
  });

  it("uses the internal backend URL on the server when the public URL is same-origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SOJ_API_BASE_URL", "/soj-api");
    vi.stubEnv("SOJ_API_INTERNAL_BASE_URL", "http://soj-api:8080");
    vi.stubGlobal("window", undefined);

    expect(apiBaseUrl()).toBe("http://soj-api:8080");
  });

  it("serializes array query values and skips empty values", () => {
    expect(buildQuery({ tag: ["dp", "math"], page: 2, empty: undefined, enabled: true })).toBe(
      "?tag=dp&tag=math&page=2&enabled=true",
    );
  });

  it.each(["problem.not_found", "contest.not_found", "submission.not_found", "contest.problem_not_found", "source_not_found"]) (
    "normalizes backend 404 code %s for route handling",
    async (code) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json(
            { data: null, error: { code, message: "Resource was not found." } },
            { status: 404 },
          ),
        ),
      );

      const error = await request("/api/v1/resource/1").catch((cause: unknown) => cause);

      expect(error).toMatchObject({ code: "not_found", status: 404 });
      expect(isNotFoundError(error)).toBe(true);
    },
  );

  it("normalizes an HTTP 404 even when the response has no backend error code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));

    const error = await request("/api/v1/resource/1").catch((cause: unknown) => cause);

    expect(error).toMatchObject({ code: "not_found", status: 404 });
    expect(isNotFoundError(error)).toBe(true);
  });
});
