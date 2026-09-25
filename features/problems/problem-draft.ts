import type { CodeDraft, DraftStorage } from "@/lib/code-draft";
import { pickCodeDraft, readCodeDrafts, writeCodeDraft } from "@/lib/code-draft";

/**
 * 题目页草稿：作用域是「某个用户在某道题上」，entry key 是语言 id。
 *
 * 分开存是按用户隔离的要求：同一台浏览器换个账号登录，不能读到上一个人的代码。
 * 具体存储载体是 `lib/code-draft.ts` 的通用编解码，这里只决定 namespace 与 key。
 */

function problemNamespace(userId: number, problemId: number): string {
  return `problem.${userId}.${problemId}`;
}

export function readProblemDraft(
  storage: DraftStorage | undefined,
  userId: number,
  problemId: number,
  languageId: number,
): CodeDraft | undefined {
  return pickCodeDraft(readCodeDrafts(storage, problemNamespace(userId, problemId)), String(languageId));
}

export function writeProblemDraft(
  storage: DraftStorage | undefined,
  userId: number,
  problemId: number,
  languageId: number,
  draft: CodeDraft,
): void {
  writeCodeDraft(storage, problemNamespace(userId, problemId), String(languageId), draft);
}
