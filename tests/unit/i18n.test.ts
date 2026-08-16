import { describe, expect, it } from "vitest";
import { defaultLocale, localeFromAcceptLanguage } from "@/lib/i18n/config";
import { localeFromPath, localizePath, unlocalizePath } from "@/lib/i18n/routing";

describe("i18n routing", () => {
  it("selects a supported locale from the weighted browser preference", () => {
    expect(localeFromAcceptLanguage("fr-FR,zh-CN;q=0.9,en;q=0.8")).toBe("zh-CN");
    expect(localeFromAcceptLanguage("en-US,en;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR")).toBe(defaultLocale);
  });

  it("recognizes and removes locale path segments", () => {
    expect(localeFromPath("/zh-CN/problems/42")).toBe("zh-CN");
    expect(unlocalizePath("/en/problems/42")).toBe("/problems/42");
    expect(unlocalizePath("/zh-CN")).toBe("/");
    expect(unlocalizePath("/problems/42")).toBe("/problems/42");
  });

  it("localizes internal paths while preserving query strings and external URLs", () => {
    expect(localizePath("zh-CN", "/problems?status=todo")).toBe("/zh-CN/problems?status=todo");
    expect(localizePath("en", "/zh-CN/problems/42")).toBe("/en/problems/42");
    expect(localizePath("zh-CN", "/")).toBe("/zh-CN");
    expect(localizePath("zh-CN", "https://example.com/problems")).toBe("https://example.com/problems");
  });
});
