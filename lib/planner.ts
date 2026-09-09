// Pure week/time helpers for the café planner. Safe to import from server and
// client code — no React, no Supabase.

import type { OpeningHours } from "@/lib/database.types";

export const SNAP = 30; // minutes

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toHHMM(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Local YYYY-MM-DD for a Date. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Midnight local Date for a YYYY-MM-DD key. */
export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** Monday (local midnight) of the week containing `d`. */
export function mondayOf(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** ?week= param → the Monday date key of that week; invalid/absent → current week. */
export function parseWeekParam(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = fromDateKey(value);
    if (!Number.isNaN(parsed.getTime())) return dateKey(mondayOf(parsed));
  }
  return dateKey(mondayOf(new Date()));
}

/** The seven date keys of the week starting at `weekStart` (a Monday key). */
export function weekDays(weekStart: string): string[] {
  const monday = fromDateKey(weekStart);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));
}

/** Duration in minutes; end <= start means the shift runs past midnight. */
export function shiftDuration(startMin: number, endMin: number): number {
  return endMin > startMin ? endMin - startMin : endMin + 1440 - startMin;
}

/**
 * Absolute minute range of a shift for overlap detection: minutes since the
 * local epoch of its date. Past-midnight shifts extend into the next day.
 */
export function absRange(date: string, startMin: number, endMin: number): [number, number] {
  const dayStart = fromDateKey(date).getTime() / 60_000;
  return [dayStart + startMin, dayStart + startMin + shiftDuration(startMin, endMin)];
}

export function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/**
 * Sensible default times for a new shift in a cell: the café's opening hours
 * for that weekday when set, else 08:00–16:00.
 */
export function defaultCellTimes(
  openingHours: OpeningHours | null | undefined,
  weekdayIdx: number,
): { start: string; end: string } {
  const day = openingHours?.[weekdayIdx];
  if (day) return { start: day.open, end: day.close };
  return { start: "08:00", end: "16:00" };
}

/** "7h" / "6.5h" style compact duration label. */
export function hoursLabel(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
}
