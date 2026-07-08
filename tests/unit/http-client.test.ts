import { afterEach, describe, expect, it, vi } from "vitest";
import { apiBaseUrl, buildQuery } from "@/lib/api/http-client";

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
});
