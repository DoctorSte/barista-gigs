// Server-only helper for creating in-app notifications. Notifications are
// written with the service role (RLS has no insert policy), so this is a
// best-effort no-op when the key isn't configured.

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

export type NotificationInput = {
  type:
    | "new_applicant"
    | "application_accepted"
    | "application_declined"
    | "new_message"
    | "gig_invite"
    | "sos_gig"
    | "referral_reward";
  title: string;
  body?: string;
  href?: string;
};

export async function notify(userId: string, input: NotificationInput): Promise<void> {
  await notifyMany([userId], input);
}

export async function notifyMany(userIds: string[], input: NotificationInput): Promise<void> {
  if (!hasAdminClient() || userIds.length === 0) return;
  try {
    await createAdminClient()
      .from("notifications")
      .insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          href: input.href ?? null,
        })),
      );
  } catch {
    // Notifications are best-effort; never fail the action that triggered them.
  }
}
