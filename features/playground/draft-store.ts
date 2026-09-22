/**
 * 练习场草稿：按语言存在 localStorage 里。
 *
 * 只留本地，不同步服务端——练习场的价值是「随手跑一下」，不是「管理代码资产」。
 * 真需要片段管理时再加服务端，那是纯增量。
 *
 * 纯函数 + 注入 storage：不在模块里直接碰 `window`，这样 Vitest 能直接测，
 * 也避免 SSR 期间访问未定义对象。写法对齐 `lib/auth/session.ts`。
 */

export type PlaygroundDraft = {
  sourceCode: string;
  stdin: string;
};

/** key 是语言的 id（字符串形式，JSON 对象键只能是字符串）。 */
export type PlaygroundDrafts = Record<string, PlaygroundDraft>;

export const playgroundDraftKey = "soj.playground.draft.v1";

/**
 * 结构版本号写进载荷里，而不是只写进 key。
 *
 * 只改 key 的话，旧数据会永远躺在 localStorage 里；写进载荷后，
 * 版本不匹配就直接丢弃并覆盖，不会解析出一个半成品。
 */
const draftVersion = 1;

type DraftPayload = {
  version: number;
  drafts: PlaygroundDrafts;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readDrafts(storage: StorageLike | undefined): PlaygroundDrafts {
  if (!storage) return {};

  let raw: string | null;
  try {
    raw = storage.getItem(playgroundDraftKey);
  } catch {
    // 隐私模式等场景下 getItem 会抛；草稿丢了不该让页面崩。
    return {};
  }
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDraftPayload(parsed)) return {};
    return parsed.drafts;
  } catch {
    return {};
  }
}

export function writeDraft(storage: StorageLike | undefined, languageId: number, draft: PlaygroundDraft): void {
  if (!storage) return;

  const drafts = { ...readDrafts(storage), [String(languageId)]: draft };
  const payload: DraftPayload = { version: draftVersion, drafts };

  try {
    storage.setItem(playgroundDraftKey, JSON.stringify(payload));
  } catch {
    // 配额满或被禁用：草稿存不下不是错误，静默放弃。
  }
}

export function pickDraft(drafts: PlaygroundDrafts, languageId: number | undefined): PlaygroundDraft | undefined {
  if (languageId === undefined) return undefined;
  return drafts[String(languageId)];
}

function isDraftPayload(value: unknown): value is DraftPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Partial<DraftPayload>;
  if (payload.version !== draftVersion) return false;
  if (typeof payload.drafts !== "object" || payload.drafts === null) return false;

  return Object.values(payload.drafts).every(isDraft);
}

function isDraft(value: unknown): value is PlaygroundDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<PlaygroundDraft>;
  return typeof draft.sourceCode === "string" && typeof draft.stdin === "string";
}
