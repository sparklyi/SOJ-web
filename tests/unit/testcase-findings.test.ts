import { describe, expect, it } from "vitest";
import { testcaseFindingMessage, testcaseFindingMessageKeys } from "@/features/problems/authoring/testcase-findings";
import { createTranslator } from "@/lib/i18n/translate";

describe("testcase findings", () => {
  const en = createTranslator("en");
  const zh = createTranslator("zh-CN");

  it("covers every documented finding code", () => {
    for (const code of [
      "testcase.zip_invalid",
      "testcase.file_name_invalid",
      "testcase.entry_empty",
      "testcase.input_missing",
      "testcase.output_missing",
      "testcase.case_duplicate",
      "testcase.archive_empty",
      "testcase.file_count_exceeded",
      "testcase.entry_too_large",
      "testcase.total_size_exceeded",
      "testcase.compression_ratio_exceeded",
      "testcase.archive_too_large",
      "testcase.archive_corrupted",
      "testcase.case_count_mismatch",
      "testcase.storage_unreadable",
      "testcase.file_ignored",
    ]) {
      expect(testcaseFindingMessageKeys[code]).toBeDefined();
    }
  });

  it("interpolates the file name for a known code", () => {
    expect(testcaseFindingMessage(en, { severity: "error", code: "testcase.output_missing", file: "3.in", message: "3.in has no matching 3.ans" })).toBe(
      "3.in has no matching output.",
    );
    expect(testcaseFindingMessage(zh, { severity: "error", code: "testcase.input_missing", file: "cases/1.ans", message: "fallback" })).toBe(
      "cases/1.ans 缺少配对的输入。",
    );
  });

  it("falls back to the backend message for an unknown code", () => {
    expect(testcaseFindingMessage(en, { severity: "error", code: "testcase.future_code", message: "backend says no" })).toBe("backend says no");
  });

  it("does not lose the message when a known code has no file", () => {
    expect(testcaseFindingMessage(en, { severity: "error", code: "testcase.archive_empty", message: "fallback" })).toBe("The archive contains no testcase pairs.");
  });
});
