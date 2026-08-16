import { expect, test } from "@playwright/test";

test("same-origin API proxy paths are not localized", async ({ request }) => {
  const response = await request.get("/soj-api/healthz", { maxRedirects: 0 });

  expect(response.status()).not.toBe(307);
  expect(response.headers().location).toBeUndefined();
});
