import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PASS = "demo-6fb541ad3e85";
const barista = createClient(url, anon, { auth: { persistSession: false } });
await barista.auth.signInWithPassword({ email: "demo-barista@baristagigs.dev", password: PASS });
const uid = (await barista.auth.getUser()).data.user.id;

// Link (as acceptStaffInvite's admin update would)
const { data: jules } = await admin.from("cafe_staff").select("id, shop_id").eq("name", "Jules").single();
await admin.from("cafe_staff").update({ user_id: uid }).eq("id", jules.id);
console.log("linked Jules row to demo-barista (simulating accepted invite)");

// Barista now reads own staff row + shifts
const { data: own } = await barista.from("cafe_staff").select("id, name, weekly_hours_target").eq("user_id", uid);
console.log("barista sees own staff row:", own);
const { data: shifts } = await barista.from("planner_shifts").select("date, start_min, end_min").eq("staff_id", jules.id).order("date").limit(3);
console.log("barista reads own shifts:", shifts?.length, "rows");

// Barista marks time off on own row — allowed
const { error: offErr } = await barista.from("staff_time_off").insert({ shop_id: jules.shop_id, staff_id: jules.id, date: "2026-09-24", note: "dentist, can start at 11" });
console.log("barista marks 2026-09-24 off:", offErr ?? "ok");

// Barista CANNOT write time off with mismatched shop or foreign staff
const { data: otherShop } = await admin.from("coffee_shops").select("id").neq("id", jules.shop_id).limit(1).maybeSingle();
if (otherShop) {
  const { error: forged } = await barista.from("staff_time_off").insert({ shop_id: otherShop.id, staff_id: jules.id, date: "2026-09-25" });
  console.log("forged shop_id insert blocked:", forged ? "yes (" + forged.code + ")" : "NO — PROBLEM");
}

// Barista cannot edit shifts (only read)
const { data: editAttempt } = await barista.from("planner_shifts").update({ start_min: 0 }).eq("staff_id", jules.id).select("id");
console.log("barista shift-edit attempt affected rows:", editAttempt?.length ?? 0, "(want 0)");
