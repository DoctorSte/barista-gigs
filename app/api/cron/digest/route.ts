import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { sendEmails, type EmailInput } from "@/lib/email";
import { emailAllowed } from "@/lib/notification-prefs";
import type { Notification, NotificationPrefs } from "@/lib/database.types";

// Daily digest: one email per user bundling unread activity that is never
// emailed instantly (messages, declines, referral rewards, team joins).
// Triggered by Vercel Cron; Vercel sends `Authorization: Bearer ${CRON_SECRET}`.

const DIGEST_TYPES = [
  "new_message",
  "application_declined",
  "referral_reward",
  "team_joined",
  "shift_completed",
  "new_review",
];
const LOOKBACK_HOURS = 48;
const MAX_LINES = 8;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
  }
  const admin = createAdminClient();

  const lookback = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await admin
    .from("notifications")
    .select("*")
    .is("read_at", null)
    .in("type", DIGEST_TYPES)
    .gt("created_at", lookback)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byUser = new Map<string, Notification[]>();
  for (const row of (rows ?? []) as Notification[]) {
    byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
  }
  if (byUser.size === 0) return NextResponse.json({ sent: 0 });

  const userIds = [...byUser.keys()];
  const { data: prefRows } = await admin
    .from("notification_prefs")
    .select("*")
    .in("user_id", userIds);
  const prefsByUser = new Map(
    ((prefRows ?? []) as NotificationPrefs[]).map((p) => [p.user_id, p]),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  const emails: EmailInput[] = [];
  const emailedUsers: string[] = [];

  for (const [userId, notifications] of byUser) {
    const prefs = prefsByUser.get(userId);
    if (prefs && !prefs.email_digest) continue;

    // Respect both the per-category toggles and the last digest watermark.
    const cutoff = prefs?.last_digest_at ?? null;
    const items = notifications.filter(
      (n) => emailAllowed(prefs, n.type) && (!cutoff || n.created_at > cutoff),
    );
    if (items.length === 0) continue;

    const { data } = await admin.auth.admin.getUserById(userId);
    const to = data?.user?.email;
    if (!to) continue;

    const lines = items.slice(0, MAX_LINES).map((n) => n.title);
    if (items.length > MAX_LINES) lines.push(`…and ${items.length - MAX_LINES} more`);

    emails.push({
      to,
      subject:
        items.length === 1
          ? "1 update waiting on Barista Gigs"
          : `${items.length} updates waiting on Barista Gigs`,
      title: "While you were away",
      body: "Here's what happened since your last visit.",
      lines,
      ctaLabel: "Catch up",
      ctaUrl: `${appUrl}/notifications`,
    });
    emailedUsers.push(userId);
  }

  await sendEmails(emails);

  const now = new Date().toISOString();
  for (const userId of emailedUsers) {
    await admin
      .from("notification_prefs")
      .upsert({ user_id: userId, last_digest_at: now, updated_at: now });
  }

  return NextResponse.json({ sent: emails.length });
}
