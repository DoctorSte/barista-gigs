"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getExtraProfile, getSession } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { firstZodError, interestSchema, type ActionResult } from "@/lib/validation";

export async function expressInterest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = interestSchema.safeParse({
    announcementId: formData.get("announcementId"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    const { message, field } = firstZodError(parsed.error);
    return { ok: false, error: message, field };
  }

  const extra = await getExtraProfile();
  if (!extra) return { ok: false, error: "Only baristas can apply to gigs." };

  const supabase = await createClient();
  const { error } = await supabase.from("interests").insert({
    announcement_id: parsed.data.announcementId,
    extra_id: extra.id,
    message: parsed.data.message,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You've already applied to this gig." };
    }
    return { ok: false, error: "Could not send your application. Try again." };
  }

  // Best-effort: tell the shop owner about the new applicant. Never let a
  // notification failure change the outcome of the application itself.
  try {
    const { profile } = await getSession();
    const { data: gig } = await supabase
      .from("announcements")
      .select("title, coffee_shops(owner_id)")
      .eq("id", parsed.data.announcementId)
      .maybeSingle();
    const ownerId = (gig?.coffee_shops as unknown as { owner_id: string } | null)?.owner_id;
    if (gig && ownerId) {
      const message = parsed.data.message;
      await notify(ownerId, {
        type: "new_applicant",
        title: `${profile?.display_name ?? "A barista"} applied to “${gig.title}”`,
        body: message
          ? message.length > 120
            ? `${message.slice(0, 120)}…`
            : message
          : undefined,
        href: `/shop/gigs/${parsed.data.announcementId}`,
      });
    }
  } catch {
    // Skip notifying when the lookup fails.
  }

  revalidatePath(`/gigs/${parsed.data.announcementId}`);
  revalidatePath("/applications");
  return { ok: true };
}
