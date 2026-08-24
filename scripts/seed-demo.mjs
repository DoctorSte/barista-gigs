// Seeds two demo accounts (a shop with an active subscription + open gig, and a
// barista) so every flow can be tested end to end.
//
//   node scripts/seed-demo.mjs
//
// Demo logins (password for both: demo-password-123):
//   shop:    demo-shop@baristagigs.dev
//   barista: demo-barista@baristagigs.dev

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "demo-password-123";

async function ensureUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    return existing.id;
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return created.user.id;
}

const { data: paris, error: cityError } = await admin
  .from("cities")
  .select("id")
  .eq("slug", "paris")
  .single();
if (cityError) throw cityError;

// --- Shop account ------------------------------------------------------------
const shopUserId = await ensureUser("demo-shop@baristagigs.dev");
await admin.from("profiles").upsert({
  id: shopUserId,
  role: "shop",
  display_name: "Margot Lefevre",
  city_id: paris.id,
});

const { data: existingShop } = await admin
  .from("coffee_shops")
  .select("id")
  .eq("owner_id", shopUserId)
  .maybeSingle();

let shopId = existingShop?.id;
if (!shopId) {
  const { data: shop, error } = await admin
    .from("coffee_shops")
    .insert({
      owner_id: shopUserId,
      city_id: paris.id,
      name: "Lueur Coffee",
      address: "12 Rue de Rivoli, 75004 Paris",
      machines: [
        { type: "espresso_machine", name: "La Marzocco Linea" },
        { type: "grinder", name: "Mahlkönig EK43" },
      ],
      description:
        "Neighbourhood specialty bar near Hôtel de Ville. Busy weekend brunch, single-origin espresso, oat-heavy crowd.",
      is_published: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  shopId = shop.id;
}

await admin.from("subscriptions").upsert({
  shop_id: shopId,
  status: "active",
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
});

const { count: gigCount } = await admin
  .from("announcements")
  .select("id", { count: "exact", head: true })
  .eq("shop_id", shopId);

if (!gigCount) {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(8, 0, 0, 0);
  const end = new Date(start);
  end.setHours(15, 0, 0, 0);
  const { error } = await admin.from("announcements").insert({
    shop_id: shopId,
    city_id: paris.id,
    title: "Saturday brunch rush cover",
    description:
      "We need a confident barista for our busiest shift. Two-group Linea, EK43 for filter, ~250 covers. You'll run the machine while our team handles floor and food. Espresso dialing and latte art expected.",
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    pay_rate_cents: 2200,
    pay_type: "hourly",
    required_skills: ["espresso", "latte_art", "service"],
    status: "open",
  });
  if (error) throw error;
}

// --- Barista account ---------------------------------------------------------
const extraUserId = await ensureUser("demo-barista@baristagigs.dev");
await admin.from("profiles").upsert({
  id: extraUserId,
  role: "extra",
  display_name: "Sam Okafor",
  city_id: paris.id,
});

const { data: existingExtra } = await admin
  .from("extras_profiles")
  .select("id")
  .eq("user_id", extraUserId)
  .maybeSingle();

if (!existingExtra) {
  const { error } = await admin.from("extras_profiles").insert({
    user_id: extraUserId,
    city_id: paris.id,
    bio: "Four years behind bars across Paris and London. Comfortable on Linea and Slayer, solid latte art, fast during rush.",
    years_experience: 4,
    hourly_rate_cents: 2400,
    skills: ["espresso", "latte_art", "pour_over", "service"],
    availability: { weekly: [{ day: 4, start: "08:00", end: "18:00" }, { day: 5, start: "08:00", end: "18:00" }, { day: 6, start: "08:00", end: "18:00" }], blackoutDates: [] },
    is_available: true,
  });
  if (error) throw error;
}

console.log("Seeded demo accounts (password: %s)", PASSWORD);
console.log("Tip: run `pnpm seed:baristas` to add a roster of Paris baristas.");
console.log("  shop:    demo-shop@baristagigs.dev");
console.log("  barista: demo-barista@baristagigs.dev");
