"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireShop } from "@/lib/auth";
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
}): Promise<ActionResult> {
  if (!DATE_RE.test(input.date) || !validTimes(input.startMin, input.endMin)) {
    return { ok: false, error: "Pick a valid date and time." };
  }
  const { shop } = await requireShop();
  const supabase = await createClient();
  const { error } = await supabase.from("planner_shifts").insert({
    shop_id: shop.id,
    staff_id: input.staffId,
    date: input.date,
    start_min: input.startMin,
    end_min: input.endMin,
    note: input.note?.trim().slice(0, 200) || null,
  });
  if (error) return { ok: false, error: "Could not save the shift. Try again." };
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
