import type { TestcaseFinding } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Translator } from "@/lib/i18n/translate";

/**
 * 测试包 finding code → 词条。
 *
 * 后端只暴露 code + file + 英文兜底 message；界面文案由这里本地化，
 * `{file}` 由翻译层插值。未知 code 直接回退后端 message，绝不显示裸 code。
 */
export const testcaseFindingMessageKeys: Record<string, MessageKey> = {
  "testcase.zip_invalid": "authoring.finding.zipInvalid",
  "testcase.file_name_invalid": "authoring.finding.fileNameInvalid",
  "testcase.entry_empty": "authoring.finding.entryEmpty",
  "testcase.input_missing": "authoring.finding.inputMissing",
  "testcase.output_missing": "authoring.finding.outputMissing",
  "testcase.case_duplicate": "authoring.finding.caseDuplicate",
  "testcase.archive_empty": "authoring.finding.archiveEmpty",
  "testcase.file_count_exceeded": "authoring.finding.fileCountExceeded",
  "testcase.entry_too_large": "authoring.finding.entryTooLarge",
  "testcase.total_size_exceeded": "authoring.finding.totalSizeExceeded",
  "testcase.compression_ratio_exceeded": "authoring.finding.compressionRatioExceeded",
  "testcase.archive_too_large": "authoring.finding.archiveTooLarge",
  "testcase.archive_corrupted": "authoring.finding.archiveCorrupted",
  "testcase.case_count_mismatch": "authoring.finding.caseCountMismatch",
  "testcase.storage_unreadable": "authoring.finding.storageUnreadable",
  "testcase.file_ignored": "authoring.finding.fileIgnored",
};

export function testcaseFindingMessage(t: Translator, finding: TestcaseFinding): string {
  const key = testcaseFindingMessageKeys[finding.code];
  if (!key) return finding.message;
  return t(key, finding.file ? { file: finding.file } : {});
}
