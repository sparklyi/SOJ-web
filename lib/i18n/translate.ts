import type { Locale } from "./config";
import { messages, type MessageKey } from "./messages";
import type { MessageValues } from "./types";

export type Translator = (key: MessageKey, values?: MessageValues) => string;

export function translate(locale: Locale, key: MessageKey, values?: MessageValues): string {
  const message = messages[key]?.[locale] ?? messages[key]?.en ?? key;
  if (!values) return message;

  return message.replace(/\{([\w-]+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function createTranslator(locale: Locale): Translator {
  return (key, values) => translate(locale, key, values);
}
