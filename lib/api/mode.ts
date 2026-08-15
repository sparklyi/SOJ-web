import type { ApiMode } from "./types";

type EnvLike = Record<string, string | undefined>;

export function getApiMode(env?: EnvLike): ApiMode {
  const source = env ?? process.env;
  const mode = source.NEXT_PUBLIC_SOJ_API_MODE;
  if (mode === "http") return "http";
  if (mode === "mock") return "mock";
  return source.NODE_ENV === "production" ? "http" : "mock";
}
