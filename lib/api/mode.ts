import type { ApiMode } from "./types";

type EnvLike = Record<string, string | undefined>;

export function getApiMode(env: EnvLike = process.env): ApiMode {
  return env.NEXT_PUBLIC_SOJ_API_MODE === "http" ? "http" : "mock";
}
