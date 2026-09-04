"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EMAIL_PREF_KEYS, type EmailPrefKey } from "@/lib/notification-prefs";
import type { ActionResult } from "@/lib/validation";
import type { NotificationPrefs } from "@/lib/database.types";

export async function setNotificationPref(
  key: EmailPrefKey,
  value: boolean,
): Promise<ActionResult> {
  if (!EMAIL_PREF_KEYS.includes(key)) {
    return { ok: false, error: "Unknown notification setting." };
  }
  const { user } = await requireUser();
  const supabase = await createClient();
  const payload: Partial<NotificationPrefs> & { user_id: string } = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  payload[key] = value;
  const { error } = await supabase.from("notification_prefs").upsert(payload);
  if (error) return { ok: false, error: "Could not save the setting. Try again." };
  revalidatePath("/settings/notifications");
  return { ok: true };
}
