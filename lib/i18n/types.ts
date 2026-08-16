import type { Locale } from "./config";

export type LocalizedMessage = Record<Locale, string>;
export type MessageCatalog = Record<string, LocalizedMessage>;
export type MessageValues = Record<string, string | number>;
