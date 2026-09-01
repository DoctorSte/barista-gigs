export const CITY_COOKIE = "bg-city";

export const SKILLS = [
  { value: "espresso", label: "Espresso" },
  { value: "latte_art", label: "Latte art" },
  { value: "pour_over", label: "Pour over" },
  { value: "roasting", label: "Roasting" },
  { value: "cupping", label: "Cupping" },
  { value: "service", label: "Service" },
  { value: "barista_training", label: "Training" },
  { value: "opening_closing", label: "Opening / closing" },
] as const;

export type SkillValue = (typeof SKILLS)[number]["value"];

const SKILL_LABELS = new Map<string, string>(SKILLS.map((s) => [s.value, s.label]));

export function skillLabel(value: string) {
  return SKILL_LABELS.get(value) ?? value.replace(/_/g, " ");
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ISO 639-1 codes; names come from Intl.DisplayNames (full ICU database,
// available in every modern browser and in the Next.js Node runtime).
export const LANGUAGE_CODES = [
  "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "cs", "cy", "da",
  "de", "el", "en", "es", "et", "eu", "fa", "fi", "fil", "fr", "ga", "gl",
  "gu", "ha", "he", "hi", "hr", "hu", "hy", "id", "ig", "is", "it", "ja",
  "ka", "kk", "km", "kn", "ko", "ku", "ky", "lb", "lo", "lt", "lv", "mk",
  "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no", "pa", "pl", "ps",
  "pt", "ro", "ru", "si", "sk", "sl", "so", "sq", "sr", "sv", "sw", "ta",
  "te", "th", "tr", "uk", "ur", "uz", "vi", "wo", "yo", "zh", "zu",
] as const;

// Values stored before the ISO switch.
const LEGACY_LANGUAGES: Record<string, string> = {
  english: "en", french: "fr", german: "de", spanish: "es", italian: "it",
  portuguese: "pt", dutch: "nl", polish: "pl", ukrainian: "uk", arabic: "ar",
  japanese: "ja", mandarin: "zh",
};

export function normalizeLanguage(value: string) {
  return LEGACY_LANGUAGES[value] ?? value;
}

/** The language's name in its own language, e.g. "fr" → "Français". */
export function languageLabel(value: string) {
  const code = normalizeLanguage(value);
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return value;
  }
}

/** The language's English name, for sorting and search. */
export function languageLabelEnglish(value: string) {
  const code = normalizeLanguage(value);
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return value;
  }
}

export const MACHINE_TYPES = [
  { value: "espresso_machine", label: "Espresso machine" },
  { value: "grinder", label: "Grinder" },
  { value: "brewer", label: "Filter / batch brewer" },
  { value: "roaster", label: "Roaster" },
  { value: "other", label: "Other" },
] as const;

export type MachineType = (typeof MACHINE_TYPES)[number]["value"];

const MACHINE_TYPE_LABELS = new Map<string, string>(MACHINE_TYPES.map((m) => [m.value, m.label]));

export function machineTypeLabel(value: string) {
  return MACHINE_TYPE_LABELS.get(value) ?? "Other";
}

