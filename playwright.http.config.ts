import { defineConfig, devices } from "@playwright/test";

const apiPort = Number(process.env.SOJ_HTTP_API_PORT ?? 8080);
if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error("Invalid SOJ_HTTP_API_PORT");

export default defineConfig({
  testDir: "./tests/http",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `NEXT_PUBLIC_SOJ_API_MODE=http SOJ_API_INTERNAL_BASE_URL=http://127.0.0.1:${apiPort} npm run dev -- -p 3100`,
    url: "http://127.0.0.1:3100/en/auth/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
