import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { sendEmails, type EmailInput } from "@/lib/email";
import { missingProfileItems } from "@/lib/profile-completeness";
import type { ExtraProfile, Profile, ProfileReminder } from "@/lib/database.types";

// Daily nudge for baristas whose profile is still missing the things cafés
// book on (photo, skills, bio, rate). At most two emails per barista — one a
// few days after signup, one more two weeks in — and none once the profile
// is complete or the digest toggle is off. Triggered by Vercel Cron, which
// sends `Authorization: Bearer ${CRON_SECRET}`.

const FIRST_NUDGE_DAYS = 2;
const SECOND_NUDGE_DAYS = 14;
const MAX_NUDGES = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
  }
  const admin = createAdminClient();
  const now = Date.now();

  const { data: extras, error } = await admin
    .from("extras_profiles")
    .select("id, user_id, bio, skills, hourly_rate_cents, rates, created_at")
    .lt("created_at", new Date(now - FIRST_NUDGE_DAYS * DAY_MS).toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!extras || extras.length === 0) return NextResponse.json({ sent: 0 });

  const userIds = extras.map((e) => e.user_id as string);
  const [{ data: profiles }, { data: reminders }, { data: prefs }] = await Promise.all([
    admin.from("profiles").select("id, avatar_url").in("id", userIds),
    admin
      .from("profile_reminders")
      .select("*")
      .in(
        "extra_id",
        extras.map((e) => e.id as string),
      ),
    admin.from("notification_prefs").select("user_id, email_digest").in("user_id", userIds),
  ]);
  const profileById = new Map(
    ((profiles ?? []) as Pick<Profile, "id" | "avatar_url">[]).map((p) => [p.id, p]),
  );
  const reminderById = new Map(
    ((reminders ?? []) as ProfileReminder[]).map((r) => [r.extra_id, r]),
  );
  const digestOff = new Set(
    (prefs ?? []).filter((p) => p.email_digest === false).map((p) => p.user_id as string),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  const emails: EmailInput[] = [];
  const nudged: { extra_id: string; sent_count: number }[] = [];

  for (const row of extras as Pick<
    ExtraProfile,
    "id" | "user_id" | "bio" | "skills" | "hourly_rate_cents" | "rates" | "created_at"
  >[]) {
    if (digestOff.has(row.user_id)) continue;

    const sent = reminderById.get(row.id)?.sent_count ?? 0;
    if (sent >= MAX_NUDGES) continue;
    // Second nudge waits until two weeks after signup, not two weeks after
    // the first email — the point is "you've been here a while", not spam.
    const ageDays = (now - new Date(row.created_at).getTime()) / DAY_MS;
    if (sent === 1 && ageDays < SECOND_NUDGE_DAYS) continue;

    const missing = missingProfileItems(row, profileById.get(row.user_id) ?? null);
    if (missing.length === 0) continue;

    const { data } = await admin.auth.admin.getUserById(row.user_id);
    const to = data?.user?.email;
    if (!to) continue;

    emails.push({
      to,
      subject:
        sent === 0
          ? "Finish your Barista Gigs profile"
          : "Cafés are looking — your profile is still incomplete",
      title: sent === 0 ? "Your profile is almost there" : "Still a few gaps in your profile",
      body: "Cafés pick baristas straight from their profiles, so a complete one gets you booked. Yours is still missing:",
      lines: missing,
      ctaLabel: "Complete my profile",
      ctaUrl: `${appUrl}/profile`,
    });
    nudged.push({ extra_id: row.id, sent_count: sent + 1 });
  }

  await sendEmails(emails);

  if (nudged.length > 0) {
    const sentAt = new Date(now).toISOString();
    await admin
      .from("profile_reminders")
      .upsert(nudged.map((n) => ({ ...n, last_sent_at: sentAt })));
  }

  return NextResponse.json({ sent: emails.length });
}
