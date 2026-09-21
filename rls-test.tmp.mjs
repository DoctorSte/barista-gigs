import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASS = "demo-6fb541ad3e85";

const shopClient = createClient(url, anon, { auth: { persistSession: false } });
const baristaClient = createClient(url, anon, { auth: { persistSession: false } });
const { error: e1 } = await shopClient.auth.signInWithPassword({ email: "demo-shop@baristagigs.dev", password: PASS });
const { error: e2 } = await baristaClient.auth.signInWithPassword({ email: "demo-barista@baristagigs.dev", password: PASS });
console.log("logins:", e1 ?? "shop ok", "|", e2 ?? "barista ok");

// 1. Café sets Jules's contract (authed client, team RLS)
const { data: staff } = await shopClient.from("cafe_staff").select("id, shop_id, name").limit(5);
const jules = staff?.[0];
console.log("staff rows visible to café:", staff?.map(s => s.name));
const defaultWeek = [
  { day: 0, start: "08:00", end: "15:00" },
  { day: 3, start: "08:00", end: "15:00" },
  { day: 4, start: "07:00", end: "14:00" },
];
const { error: e3 } = await shopClient.from("cafe_staff")
  .update({ weekly_hours_target: 21, default_week: defaultWeek }).eq("id", jules.id);
console.log("café sets contract:", e3 ?? "ok (21h target, 3-day default week)");

// 2. Barista CANNOT read staff rows they're not linked to
const { data: before } = await baristaClient.from("cafe_staff").select("id");
console.log("barista sees staff rows before link:", before?.length ?? 0, "(want 0)");

// 3. Barista cannot link themselves (update blocked by RLS)
const { data: selfLink } = await baristaClient.from("cafe_staff")
  .update({ user_id: (await baristaClient.auth.getUser()).data.user.id }).eq("id", jules.id).select("id");
console.log("barista self-link attempt affected rows:", selfLink?.length ?? 0, "(want 0)");
