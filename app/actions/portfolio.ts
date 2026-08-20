"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getExtraProfile } from "@/lib/auth";
import type { ActionResult } from "@/lib/validation";

export async function addPortfolioPhoto(storagePath: string, caption: string): Promise<ActionResult> {
  const extra = await getExtraProfile();
  if (!extra) return { ok: false, error: "Not allowed" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("portfolio_photos")
    .select("id", { count: "exact", head: true })
    .eq("extra_id", extra.id);

  const { error } = await supabase.from("portfolio_photos").insert({
    extra_id: extra.id,
    storage_path: storagePath,
    caption: caption.trim() || null,
    sort_order: count ?? 0,
  });
  if (error) return { ok: false, error: "Could not save the photo." };

  revalidatePath("/profile");
  return { ok: true };
}

export async function deletePortfolioPhoto(photoId: string): Promise<ActionResult> {
  const extra = await getExtraProfile();
  if (!extra) return { ok: false, error: "Not allowed" };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("portfolio_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("extra_id", extra.id)
    .maybeSingle();
  if (!photo) return { ok: false, error: "Photo not found" };

  const { error } = await supabase.from("portfolio_photos").delete().eq("id", photo.id);
  if (error) return { ok: false, error: "Could not delete the photo." };

  await supabase.storage.from("portfolio").remove([photo.storage_path]);

  revalidatePath("/profile");
  return { ok: true };
}
