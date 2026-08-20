// Seeds three more Paris coffee shops (with coordinates + active subscriptions)
// and a batch of open gigs — some multi-date — so the gigs page has enough data
// for filters and the map view. Also geocodes any existing shop that has no
// coordinates yet. Idempotent — safe to re-run.
//
//   node scripts/seed-gigs.mjs
//
// Shop logins use password: demo-password-123

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

const SHOPS = [
  {
    email: "clement@substancecafe.dev",
    owner: "Clément Aubry",
    name: "Substance Café",
    address: "32 Rue de Dunkerque, 75010 Paris",
    lat: 48.8809,
    lng: 2.3499,
    machines: [
      { type: "espresso_machine", name: "Slayer Espresso" },
      { type: "grinder", name: "Mahlkönig E65S" },
    ],
    description: "Filter-forward café by Gare du Nord. Calm mornings, packed afternoons.",
  },
  {
    email: "ines@boot.cafe.dev",
    owner: "Inès Laurent",
    name: "Boot Café",
    address: "19 Rue du Pont aux Choux, 75003 Paris",
    lat: 48.8608,
    lng: 2.3654,
    machines: [
      { type: "espresso_machine", name: "La Marzocco GB5" },
      { type: "grinder", name: "Mythos One" },
    ],
    description: "Tiny iconic Marais shoebox. Two baristas max behind the bar, constant queue.",
  },
  {
    email: "marco@terresdecafe.dev",
    owner: "Marco Bellini",
    name: "Terres de Café Batignolles",
    address: "15 Rue Legendre, 75017 Paris",
    lat: 48.8846,
    lng: 2.3162,
    machines: [
      { type: "espresso_machine", name: "Victoria Arduino Black Eagle" },
      { type: "grinder", name: "Mahlkönig EK43" },
      { type: "brewer", name: "Marco SP9" },
    ],
    description: "Roaster-owned café in Batignolles. Weekend brunch and slow-bar service.",
  },
];

function day(offset, time) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

function isoDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// shifts: [dayOffset, start, end]
const GIGS = [
  {
    shop: "Substance Café",
    title: "Morning filter bar cover",
    description:
      "Run our slow bar (V60 + batch) while the head barista is at a competition. Quiet start, busy from 9. Dialing in filter recipes expected.",
    shifts: [
      [3, "07:30", "13:00"],
      [4, "07:30", "13:00"],
    ],
    pay: 2300,
    payType: "hourly",
    skills: ["pour_over", "service"],
  },
  {
    shop: "Substance Café",
    title: "",
    description:
      "Afternoon espresso shift, standard bar work, some dishes. Friendly regulars, no latte art pressure.",
    shifts: [[6, "13:00", "19:00"]],
    pay: 2000,
    payType: "hourly",
    skills: ["espresso", "service"],
  },
  {
    shop: "Boot Café",
    title: "Weekend rush — two Saturdays",
    description:
      "Tiny bar, huge queue. You'll pull shots non-stop on the GB5 while the owner handles pastries and the till. Fast hands essential.",
    shifts: [
      [5, "08:00", "16:00"],
      [12, "08:00", "16:00"],
    ],
    pay: 2600,
    payType: "hourly",
    skills: ["espresso", "latte_art", "service"],
  },
  {
    shop: "Boot Café",
    title: "Opening cover",
    description:
      "Open the shop solo: machine warm-up, grinder dial-in, pastry delivery, first two hours of service.",
    shifts: [[8, "07:00", "11:00"]],
    pay: 2400,
    payType: "hourly",
    skills: ["espresso", "opening_closing"],
  },
  {
    shop: "Terres de Café Batignolles",
    title: "Brunch weekend support",
    description:
      "Support our team through brunch service on the Black Eagle. ~200 covers a day, oat-heavy, lots of latte art.",
    shifts: [
      [5, "09:00", "16:00"],
      [6, "09:00", "16:00"],
    ],
    pay: 2500,
    payType: "hourly",
    skills: ["espresso", "latte_art", "service"],
  },
  {
    shop: "Terres de Café Batignolles",
    title: "Cupping event host",
    description:
      "Host a public cupping of our new Ethiopian arrivals. Flat fee for the evening, includes setup and teardown.",
    shifts: [[9, "18:00", "21:30"]],
    pay: 18000,
    payType: "flat",
    skills: ["cupping", "barista_training"],
  },
  {
    shop: "Lueur Coffee",
    title: "",
    description:
      "Weekday espresso cover while Margot is away — three consecutive mornings on the Linea. Same setup each day.",
    shifts: [
      [7, "08:00", "14:00"],
      [8, "08:00", "14:00"],
      [9, "08:00", "14:00"],
    ],
    pay: 2200,
    payType: "hourly",
    skills: ["espresso", "service"],
  },
  {
    shop: "Lueur Coffee",
    title: "Latte art throwdown bar",
    description:
      "We're hosting a Thursday-night throwdown — keep drinks flowing for ~60 guests and help judge warm-up pours.",
    shifts: [[10, "18:00", "23:00"]],
    pay: 2800,
    payType: "hourly",
    skills: ["latte_art", "espresso"],
  },
];

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

// --- Shops -------------------------------------------------------------------
const shopIdByName = new Map();

for (const shop of SHOPS) {
  const userId = await ensureUser(shop.email);
  await admin.from("profiles").upsert({
    id: userId,
    role: "shop",
    display_name: shop.owner,
    city_id: paris.id,
  });

  const values = {
    city_id: paris.id,
    name: shop.name,
    address: shop.address,
    lat: shop.lat,
    lng: shop.lng,
    machines: shop.machines,
    description: shop.description,
    is_published: true,
  };

  const { data: existing } = await admin
    .from("coffee_shops")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  let shopId = existing?.id;
  if (shopId) {
    await admin.from("coffee_shops").update(values).eq("id", shopId);
  } else {
    const { data: created, error } = await admin
      .from("coffee_shops")
      .insert({ owner_id: userId, ...values })
      .select("id")
      .single();
    if (error) throw error;
    shopId = created.id;
  }
  shopIdByName.set(shop.name, shopId);

  await admin.from("subscriptions").upsert({
    shop_id: shopId,
    status: "active",
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log("  shop: %s (%s)", shop.name, shop.email);
}

// Include pre-existing shops as gig targets.
const { data: allShops } = await admin.from("coffee_shops").select("id, name, address, lat, lng");
for (const shop of allShops ?? []) {
  if (!shopIdByName.has(shop.name)) shopIdByName.set(shop.name, shop.id);
}

// --- Geocode shops still missing coordinates ---------------------------------
for (const shop of allShops ?? []) {
  if (shop.lat != null && shop.lng != null) continue;
  const nominatim = new URL("https://nominatim.openstreetmap.org/search");
  nominatim.searchParams.set("q", `${shop.address}, Paris`);
  nominatim.searchParams.set("format", "json");
  nominatim.searchParams.set("limit", "1");
  const response = await fetch(nominatim, {
    headers: { Accept: "application/json", "User-Agent": "BaristaGigs/1.0 (seed geocoding)" },
  });
  const hits = response.ok ? await response.json() : [];
  const hit = hits[0];
  if (hit) {
    await admin
      .from("coffee_shops")
      .update({ lat: Number.parseFloat(hit.lat), lng: Number.parseFloat(hit.lon) })
      .eq("id", shop.id);
    console.log("  geocoded: %s", shop.name);
  } else {
    console.log("  could not geocode: %s (%s)", shop.name, shop.address);
  }
  await new Promise((resolve) => setTimeout(resolve, 1100)); // Nominatim rate limit
}

// --- Gigs --------------------------------------------------------------------
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

for (const gig of GIGS) {
  const shopId = shopIdByName.get(gig.shop);
  if (!shopId) {
    console.log("  skipping gig for unknown shop: %s", gig.shop);
    continue;
  }

  const shifts = gig.shifts.map(([offset, start, end]) => ({
    date: isoDate(offset),
    start,
    end,
  }));
  const startsAt = day(gig.shifts[0][0], gig.shifts[0][1]);
  const last = gig.shifts[gig.shifts.length - 1];
  const endsAt = day(last[0], last[2]);
  const title = gig.title || defaultTitle(shifts);

  const { data: existing } = await admin
    .from("announcements")
    .select("id")
    .eq("shop_id", shopId)
    .eq("description", gig.description)
    .maybeSingle();
  if (existing) {
    console.log("  gig exists: %s", title);
    continue;
  }

  const { error } = await admin.from("announcements").insert({
    shop_id: shopId,
    city_id: paris.id,
    title,
    description: gig.description,
    shifts,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    pay_rate_cents: gig.pay,
    pay_type: gig.payType,
    required_skills: gig.skills,
    status: "open",
  });
  if (error) throw error;
  console.log("  gig: %s @ %s", title, gig.shop);
}

console.log("Done.");
