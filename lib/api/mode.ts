import type { ApiMode } from "./types";

type EnvLike = Record<string, string | undefined>;

export function getApiMode(env?: EnvLike): ApiMode {
  const mode = env?.NEXT_PUBLIC_SOJ_API_MODE ?? process.env.NEXT_PUBLIC_SOJ_API_MODE;
  return mode === "http" ? "http" : "mock";
}
