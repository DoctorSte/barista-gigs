import { cache } from "react";
import { cookies } from "next/headers";
import { en, type Dict } from "./en";
import { fr } from "./fr";

export type AppLocale = "en" | "fr";
export const LOCALE_COOKIE = "locale";

const DICTS: Record<AppLocale, Dict> = { en, fr };

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "fr";
}

/** The viewer's app locale, from the `locale` cookie. Server-side only. */
export const getLocale = cache(async (): Promise<AppLocale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isAppLocale(value) ? value : "en";
});

/** The dictionary for the viewer's locale. Server-side only. */
export async function getDict(): Promise<Dict> {
  return DICTS[await getLocale()];
}

/** Intl locale tag for date formatting. */
export function dateLocale(locale: AppLocale): string {
  return locale === "fr" ? "fr-FR" : "en-GB";
}

export type { Dict };
