/**
 * 代码草稿：一份带作用域的本地存储编解码器。
 *
 * 练习场与题目页都需要「按语言记住我敲的代码」，差别只在**作用域**：
 * 练习场是全局的，题目页是「某个用户在某道题上」的。把编解码留在这里，
 * 两个调用方各自只决定 namespace（存哪个 key）与 entry key（语言 / 题号+语言）。
 *
 * 只留本地，不同步服务端——它的价值是「别把没提交的代码弄丢」，
 * 不是代码资产管理。纯函数 + 注入 storage：不在模块里直接碰 `window`，
 * 这样 Vitest 能直接测，也避免 SSR 期间访问未定义对象。
 */

export type CodeDraft = {
  sourceCode: string;
  stdin: string;
};

export type CodeDrafts = Record<string, CodeDraft>;

export type DraftStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * 结构版本号写进载荷里，而不是只写进 key。
 *
 * 只改 key 的话，旧数据会永远躺在 localStorage 里；写进载荷后，
 * 版本不匹配就直接丢弃并覆盖，不会解析出一个半成品。
 */
const draftVersion = 1;

type DraftPayload = {
  version: number;
  drafts: CodeDrafts;
};

export function codeDraftKey(namespace: string): string {
  return `soj.${namespace}.draft.v1`;
}

export function readCodeDrafts(storage: DraftStorage | undefined, namespace: string): CodeDrafts {
  if (!storage) return {};

  let raw: string | null;
  try {
    raw = storage.getItem(codeDraftKey(namespace));
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

export function writeCodeDraft(storage: DraftStorage | undefined, namespace: string, entryKey: string, draft: CodeDraft): void {
  if (!storage) return;

  const drafts = { ...readCodeDrafts(storage, namespace), [entryKey]: draft };
  const payload: DraftPayload = { version: draftVersion, drafts };

  try {
    storage.setItem(codeDraftKey(namespace), JSON.stringify(payload));
  } catch {
    // 配额满或被禁用：草稿存不下不是错误，静默放弃。
  }
}

export function pickCodeDraft(drafts: CodeDrafts, entryKey: string | undefined): CodeDraft | undefined {
  if (entryKey === undefined) return undefined;
  return drafts[entryKey];
}

function isDraftPayload(value: unknown): value is DraftPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Partial<DraftPayload>;
  if (payload.version !== draftVersion) return false;
  if (typeof payload.drafts !== "object" || payload.drafts === null) return false;

  return Object.values(payload.drafts).every(isDraft);
}

function isDraft(value: unknown): value is CodeDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<CodeDraft>;
  return typeof draft.sourceCode === "string" && typeof draft.stdin === "string";
}
