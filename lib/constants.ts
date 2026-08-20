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

export const SUBSCRIPTION_PRICE_EUR = 29;
