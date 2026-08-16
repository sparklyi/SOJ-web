import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { isLocale } from "./config";
import { createTranslator } from "./translate";

export async function getServerLocale() {
  const value = await rootLocale();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getServerTranslator() {
  return createTranslator(await getServerLocale());
}
