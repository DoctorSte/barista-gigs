// Moves stale open demo gigs forward by whole weeks so the browse/map views
// stay populated. Weekday alignment is preserved (Saturday gigs stay Saturday).
// Touches nothing but open announcements whose last shift is in the past.
//
//   node scripts/refresh-demo-gigs.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const now = new Date();
const { data: gigs, error } = await admin
  .from("announcements")
  .select("id, title, shifts, starts_at, ends_at, status")
  .eq("status", "open")
  .lt("ends_at", now.toISOString());
if (error) throw error;

function shiftDate(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultTitle(shifts) {
  const first = new Date(`${shifts[0].date}T00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return shifts.length === 1
    ? `Barista shift · ${first}`
    : `${shifts.length} barista shifts · from ${first}`;
}

for (const gig of gigs ?? []) {
  const firstShift = new Date(`${gig.shifts[0].date}T12:00:00`);
  const daysBehind = Math.ceil((now - firstShift) / 86400000);
  const jump = (Math.ceil(daysBehind / 7) + 1) * 7; // whole weeks, lands 1-2 weeks out

  const shifts = gig.shifts.map((s) => ({ ...s, date: shiftDate(s.date, jump) }));
  const startsAt = new Date(gig.starts_at);
  startsAt.setDate(startsAt.getDate() + jump);
  const endsAt = new Date(gig.ends_at);
  endsAt.setDate(endsAt.getDate() + jump);
  const title = /barista shifts? · /i.test(gig.title) ? defaultTitle(shifts) : gig.title;

  const { error: updateError } = await admin
    .from("announcements")
    .update({
      shifts,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      title,
    })
    .eq("id", gig.id);
  if (updateError) throw updateError;
  console.log("  moved +%dd: %s", jump, title);
}
console.log("done (%d gigs)", gigs?.length ?? 0);
