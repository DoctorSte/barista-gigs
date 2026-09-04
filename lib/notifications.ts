// Server-only helper for creating in-app notifications. Notifications are
// written with the service role (RLS has no insert policy), so this is a
// best-effort no-op when the key isn't configured.

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { sendEmails, type EmailInput } from "@/lib/email";

// Notification types that also go out as an email. Messages and referral
// rewards stay in-app only for now (messages would need unread batching).
const EMAILED_TYPES = new Set(["new_applicant", "application_accepted", "gig_invite", "sos_gig"]);

export type NotificationInput = {
  type:
    | "new_applicant"
    | "application_accepted"
    | "application_declined"
    | "new_message"
    | "gig_invite"
    | "sos_gig"
    | "referral_reward"
    | "team_invite"
    | "team_joined";
  title: string;
  body?: string;
  href?: string;
};

export async function notify(userId: string, input: NotificationInput): Promise<void> {
  await notifyMany([userId], input);
}

export async function notifyMany(userIds: string[], input: NotificationInput): Promise<void> {
  if (!hasAdminClient() || userIds.length === 0) return;
  const admin = createAdminClient();
  try {
    await admin.from("notifications").insert(
      userIds.map((userId) => ({
        user_id: userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      })),
    );

    if (EMAILED_TYPES.has(input.type) && process.env.RESEND_API_KEY) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
      const emails: EmailInput[] = [];
      for (const userId of userIds) {
        const { data } = await admin.auth.admin.getUserById(userId);
        const to = data?.user?.email;
        if (!to) continue;
        emails.push({
          to,
          subject: input.title,
          title: input.title,
          body: input.body,
          ctaLabel: "View on Barista Gigs",
          ctaUrl: `${appUrl}${input.href ?? "/notifications"}`,
        });
      }
      await sendEmails(emails);
    }
  } catch {
    // Notifications are best-effort; never fail the action that triggered them.
  }
}
