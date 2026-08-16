import type { ApiMode } from "./types";

type EnvLike = Record<string, string | undefined>;

export function getApiMode(env?: EnvLike): ApiMode {
  // Keep public env access static so Next.js inlines it into client bundles.
  const source = env ?? {
    NEXT_PUBLIC_SOJ_API_MODE: process.env.NEXT_PUBLIC_SOJ_API_MODE,
    NODE_ENV: process.env.NODE_ENV,
  };
  const mode = source.NEXT_PUBLIC_SOJ_API_MODE;
  if (mode === "http") return "http";
  if (mode === "mock") return "mock";
  return source.NODE_ENV === "production" ? "http" : "mock";
}
