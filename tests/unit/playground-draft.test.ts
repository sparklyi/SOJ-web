import { describe, expect, it } from "vitest";
import { pickDraft, playgroundDraftKey, readDrafts, writeDraft } from "@/features/playground/draft-store";

/**
 * 草稿是「本地优先」的存储，失败模式全是静默的——存不下、读不出、
 * 结构变了。这些分支在真实使用里很难触发，所以必须在这里钉死：
 * 任何一条退化成抛异常，练习场就会白屏。
 */
function memoryStorage(initial?: string) {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(playgroundDraftKey, initial);

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    raw: () => store.get(playgroundDraftKey),
  };
}

describe("playground draft store", () => {
  it("round-trips a draft per language", () => {
    const storage = memoryStorage();

    writeDraft(storage, 71, { sourceCode: "package main", stdin: "1 2\n" });
    writeDraft(storage, 60, { sourceCode: "int main(){}", stdin: "" });

    const drafts = readDrafts(storage);
    expect(pickDraft(drafts, 71)).toEqual({ sourceCode: "package main", stdin: "1 2\n" });
    expect(pickDraft(drafts, 60)).toEqual({ sourceCode: "int main(){}", stdin: "" });
  });

  it("keeps languages independent when one is overwritten", () => {
    const storage = memoryStorage();

    writeDraft(storage, 71, { sourceCode: "first", stdin: "a" });
    writeDraft(storage, 60, { sourceCode: "other", stdin: "b" });
    writeDraft(storage, 71, { sourceCode: "second", stdin: "c" });

    const drafts = readDrafts(storage);
    expect(pickDraft(drafts, 71)).toEqual({ sourceCode: "second", stdin: "c" });
    expect(pickDraft(drafts, 60)).toEqual({ sourceCode: "other", stdin: "b" });
  });

  it("returns nothing for a language that was never written", () => {
    const storage = memoryStorage();
    writeDraft(storage, 71, { sourceCode: "x", stdin: "" });

    expect(pickDraft(readDrafts(storage), 999)).toBeUndefined();
  });

  it("returns nothing when the language id is not known yet", () => {
    expect(pickDraft(readDrafts(memoryStorage()), undefined)).toBeUndefined();
  });

  it("survives corrupt JSON instead of throwing", () => {
    const storage = memoryStorage("{not json");
    expect(readDrafts(storage)).toEqual({});
  });

  it("discards a payload written by an older structure version", () => {
    const storage = memoryStorage(JSON.stringify({ version: 0, drafts: { "71": { sourceCode: "old", stdin: "" } } }));
    expect(readDrafts(storage)).toEqual({});
  });

  it("discards a payload whose drafts are not drafts", () => {
    const storage = memoryStorage(JSON.stringify({ version: 1, drafts: { "71": { sourceCode: 5 } } }));
    expect(readDrafts(storage)).toEqual({});
  });

  it("ignores storage that is unavailable", () => {
    expect(readDrafts(undefined)).toEqual({});
    expect(() => writeDraft(undefined, 71, { sourceCode: "x", stdin: "" })).not.toThrow();
  });

  it("swallows a storage that refuses writes", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };

    expect(() => writeDraft(storage, 71, { sourceCode: "x", stdin: "" })).not.toThrow();
  });

  it("starts fresh when the storage read throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => undefined,
    };

    expect(readDrafts(storage)).toEqual({});
  });
});
