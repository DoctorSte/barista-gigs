"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireShop } from "@/lib/auth";
import { addDays, dateKey, fromDateKey, weekDays } from "@/lib/planner";
import type { ActionResult } from "@/lib/validation";

// Internal staff + shifts for the planner. All rows are RLS-guarded to the
// café team via the policies on cafe_staff / planner_shifts, so these actions
// only validate input and scope inserts to the active shop.

function validTimes(startMin: number, endMin: number): boolean {
  return (
    Number.isInteger(startMin) &&
    Number.isInteger(endMin) &&
    startMin >= 0 &&
    startMin < 1440 &&
    endMin > 0 &&
    endMin <= 1440
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function addStaff(name: string): Promise<ActionResult<{ id: string }>> {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return { ok: false, error: "Enter a name." };
  const { shop } = await requireShop();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_staff")
    .insert({ shop_id: shop.id, name: trimmed })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not add them. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true, data: { id: data.id } };
}

export async function renameStaff(staffId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return { ok: false, error: "Enter a name." };
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase.from("cafe_staff").update({ name: trimmed }).eq("id", staffId);
  if (error) return { ok: false, error: "Could not rename them. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function removeStaff(staffId: string): Promise<ActionResult> {
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase.from("cafe_staff").delete().eq("id", staffId);
  if (error) return { ok: false, error: "Could not remove them. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function createPlannerShift(input: {
  staffId: string;
  date: string;
  startMin: number;
  endMin: number;
  note?: string;
  /** Also write the same shift on the following weeks (1 = just this one). */
  repeatWeeks?: number;
}): Promise<ActionResult> {
  if (!DATE_RE.test(input.date) || !validTimes(input.startMin, input.endMin)) {
    return { ok: false, error: "Pick a valid date and time." };
  }
  const repeats = Math.min(Math.max(Math.round(input.repeatWeeks ?? 1), 1), 26);
  const { shop } = await requireShop();
  const supabase = await createClient();
  const start = fromDateKey(input.date);
  const rows = Array.from({ length: repeats }, (_, week) => ({
    shop_id: shop.id,
    staff_id: input.staffId,
    date: dateKey(addDays(start, week * 7)),
    start_min: input.startMin,
    end_min: input.endMin,
    note: input.note?.trim().slice(0, 200) || null,
  }));
  const { error } = await supabase.from("planner_shifts").insert(rows);
  if (error) return { ok: false, error: "Could not save the shift. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}

/**
 * Duplicates the previous week's internal shifts into `weekStart`'s week —
 * the usual case of "same rota as last week". Shifts that already exist at
 * the same time for the same person are skipped, so it is safe to re-run.
 */
export async function copyPreviousWeek(
  weekStart: string,
): Promise<ActionResult<{ copied: number }>> {
  if (!DATE_RE.test(weekStart)) return { ok: false, error: "Pick a valid week." };
  const { shop } = await requireShop();
  const supabase = await createClient();

  const sourceDays = weekDays(dateKey(addDays(fromDateKey(weekStart), -7)));
  const targetDays = weekDays(weekStart);

  const [{ data: sourceRows }, { data: targetRows }] = await Promise.all([
    supabase
      .from("planner_shifts")
      .select("staff_id, date, start_min, end_min, note")
      .eq("shop_id", shop.id)
      .in("date", sourceDays),
    supabase
      .from("planner_shifts")
      .select("staff_id, date, start_min, end_min")
      .eq("shop_id", shop.id)
      .in("date", targetDays),
  ]);

  const existing = new Set(
    (targetRows ?? []).map(
      (row) => `${row.staff_id}|${row.date}|${row.start_min}|${row.end_min}`,
    ),
  );
  const rows = (sourceRows ?? [])
    .map((row) => ({
      shop_id: shop.id,
      staff_id: row.staff_id,
      date: dateKey(addDays(fromDateKey(row.date), 7)),
      start_min: row.start_min,
      end_min: row.end_min,
      note: row.note,
    }))
    .filter((row) => !existing.has(`${row.staff_id}|${row.date}|${row.start_min}|${row.end_min}`));

  if (rows.length === 0) return { ok: true, data: { copied: 0 } };
  const { error } = await supabase.from("planner_shifts").insert(rows);
  if (error) return { ok: false, error: "Could not copy last week. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true, data: { copied: rows.length } };
}

/** Drag/drop in the day view: move a shift in time (and optionally to another day). */
export async function movePlannerShift(input: {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
}): Promise<ActionResult> {
  if (!DATE_RE.test(input.date) || !validTimes(input.startMin, input.endMin)) {
    return { ok: false, error: "Pick a valid date and time." };
  }
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("planner_shifts")
    .update({ date: input.date, start_min: input.startMin, end_min: input.endMin })
    .eq("id", input.id);
  if (error) return { ok: false, error: "Could not move the shift. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function updatePlannerShift(input: {
  id: string;
  startMin: number;
  endMin: number;
  note?: string;
}): Promise<ActionResult> {
  if (!validTimes(input.startMin, input.endMin)) {
    return { ok: false, error: "Pick a valid time." };
  }
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase
    .from("planner_shifts")
    .update({
      start_min: input.startMin,
      end_min: input.endMin,
      note: input.note?.trim().slice(0, 200) || null,
    })
    .eq("id", input.id);
  if (error) return { ok: false, error: "Could not save the shift. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}

export async function deletePlannerShift(id: string): Promise<ActionResult> {
  await requireShop();
  const supabase = await createClient();
  const { error } = await supabase.from("planner_shifts").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete the shift. Try again." };
  revalidatePath("/cafe/planner");
  return { ok: true };
}
