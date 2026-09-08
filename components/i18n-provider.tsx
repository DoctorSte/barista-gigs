"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { en, type Dict } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import type { AppLocale } from "@/lib/i18n";

// Dictionaries contain functions (parameterized strings), which can't cross
// the RSC serialization boundary — so only the locale string comes from the
// server and both dictionaries ship in the client bundle.

const I18nContext = createContext<AppLocale>("en");

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useDict(): Dict {
  const locale = useContext(I18nContext);
  return useMemo(() => (locale === "fr" ? fr : en), [locale]);
}

export function useLocale(): AppLocale {
  return useContext(I18nContext);
}

/** BCP-47 tag for date formatting ("fr-FR" / "en-GB"). */
export function useLocaleTag(): string {
  return useContext(I18nContext) === "fr" ? "fr-FR" : "en-GB";
}
