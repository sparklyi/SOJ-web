import { describe, expect, it } from "vitest";
import { readProblemDraft, writeProblemDraft } from "@/features/problems/problem-draft";

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
}

describe("problem draft store", () => {
  it("keeps a draft per problem and language", () => {
    const storage = memoryStorage();

    writeProblemDraft(storage, 7, 101, 71, { sourceCode: "package main", stdin: "" });
    writeProblemDraft(storage, 7, 101, 60, { sourceCode: "int main(){}", stdin: "1 2\n" });
    writeProblemDraft(storage, 7, 202, 71, { sourceCode: "other problem", stdin: "" });

    expect(readProblemDraft(storage, 7, 101, 71)?.sourceCode).toBe("package main");
    expect(readProblemDraft(storage, 7, 101, 60)?.sourceCode).toBe("int main(){}");
    expect(readProblemDraft(storage, 7, 202, 71)?.sourceCode).toBe("other problem");
    expect(readProblemDraft(storage, 7, 101, 99)).toBeUndefined();
  });

  it("isolates drafts by user", () => {
    const storage = memoryStorage();

    writeProblemDraft(storage, 7, 101, 71, { sourceCode: "user seven", stdin: "" });

    expect(readProblemDraft(storage, 8, 101, 71)).toBeUndefined();
    expect(readProblemDraft(storage, 7, 101, 71)?.sourceCode).toBe("user seven");
  });

  it("treats a missing storage as no draft instead of throwing", () => {
    expect(readProblemDraft(undefined, 7, 101, 71)).toBeUndefined();
    expect(() => writeProblemDraft(undefined, 7, 101, 71, { sourceCode: "x", stdin: "" })).not.toThrow();
  });
});
