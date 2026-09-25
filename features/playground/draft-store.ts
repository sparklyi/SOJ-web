import {
  codeDraftKey,
  pickCodeDraft,
  readCodeDrafts,
  writeCodeDraft,
  type CodeDraft,
  type CodeDrafts,
  type DraftStorage,
} from "@/lib/code-draft";

/**
 * 练习场草稿：按语言存在 localStorage 里。
 *
 * 编解码本身在 `lib/code-draft.ts`，这里只固定作用域为「练习场」，
 * 并把语言 id 作为 entry key。保留这层薄封装是为了让调用方读起来
 * 仍然是「练习场按语言存草稿」，而不是一处需要自己拼 namespace 的裸调用。
 */

export type PlaygroundDraft = CodeDraft;
export type PlaygroundDrafts = CodeDrafts;

export const playgroundDraftKey = codeDraftKey("playground");

const namespace = "playground";

type StorageLike = DraftStorage;

export function readDrafts(storage: StorageLike | undefined): PlaygroundDrafts {
  return readCodeDrafts(storage, namespace);
}

export function writeDraft(storage: StorageLike | undefined, languageId: number, draft: PlaygroundDraft): void {
  writeCodeDraft(storage, namespace, String(languageId), draft);
}

export function pickDraft(drafts: PlaygroundDrafts, languageId: number | undefined): PlaygroundDraft | undefined {
  return pickCodeDraft(drafts, languageId === undefined ? undefined : String(languageId));
}
