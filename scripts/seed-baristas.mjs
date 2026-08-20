// Seeds a roster of Paris baristas (profiles, rates, fun fields), gives three of
// them a past filled shift at the demo shop (Lueur Coffee), and adds
// recommendations from that shop. Idempotent — safe to re-run.
//
//   node scripts/seed-baristas.mjs
//
// All accounts use password: demo-password-123

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

const BARISTAS = [
  {
    email: "lea.marchand@baristagigs.dev",
    name: "Léa Marchand",
    bio: "Six years across Paris specialty bars, ex-head barista at a Marais roastery. Calm under a queue out the door.",
    years: 6,
    rate: 2600,
    rates: [
      { label: "Events & catering", cents: 3200 },
      { label: "Barista training", cents: 4000 },
    ],
    signature: "Lavender oat flat white",
    instagram: "lea.pours",
    skills: ["espresso", "latte_art", "service", "opening_closing"],
    weekly: [0, 1, 2, 3, 4],
  },
  {
    email: "diego.fuentes@baristagigs.dev",
    name: "Diego Fuentes",
    bio: "Madrid-trained, Paris-based. Fast bar service and a soft spot for cortados done right.",
    years: 3,
    rate: 2200,
    rates: [{ label: "Events & catering", cents: 2800 }],
    signature: "Café bombón",
    instagram: "diegopulls",
    skills: ["espresso", "service"],
    weekly: [3, 4, 5, 6],
  },
  {
    email: "amara.diallo@baristagigs.dev",
    name: "Amara Diallo",
    bio: "Competition-level pour over, eight years in the game, judges cuppings on weekends.",
    years: 8,
    rate: 3000,
    rates: [
      { label: "Events & catering", cents: 3800 },
      { label: "Barista training", cents: 4500 },
      { label: "Cupping host", cents: 5000 },
    ],
    signature: "Gesha pour over flight",
    instagram: "amara.brews",
    skills: ["espresso", "pour_over", "cupping", "barista_training"],
    weekly: [0, 1, 2, 5, 6],
  },
  {
    email: "tom.beckett@baristagigs.dev",
    name: "Tom Beckett",
    bio: "London émigré. Two years on a three-group Linea in Soho; opens early without complaint.",
    years: 2,
    rate: 2000,
    rates: [],
    signature: "Iced long black, no fuss",
    instagram: "tomtamps",
    skills: ["espresso", "opening_closing", "service"],
    weekly: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    email: "yuki.tanaka@baristagigs.dev",
    name: "Yuki Tanaka",
    bio: "Kyoto kissaten roots, Paris present. Slow bar specialist — siphon, V60, cloth filter.",
    years: 5,
    rate: 2500,
    rates: [{ label: "Slow bar events", cents: 3500 }],
    signature: "Siphon-brewed Yirgacheffe",
    instagram: "yuki.slowbar",
    skills: ["pour_over", "cupping", "service"],
    weekly: [1, 2, 3, 4],
  },
  {
    email: "nina.kowalska@baristagigs.dev",
    name: "Nina Kowalska",
    bio: "Latte art medalist, does weddings and product launches. Will out-pour anyone politely.",
    years: 4,
    rate: 2400,
    rates: [
      { label: "Events & catering", cents: 3000 },
      { label: "Latte art workshops", cents: 3800 },
    ],
    signature: "Swan-on-swan latte",
    instagram: "nina.rosetta",
    skills: ["espresso", "latte_art", "barista_training"],
    weekly: [4, 5, 6],
  },
  {
    email: "karim.haddad@baristagigs.dev",
    name: "Karim Haddad",
    bio: "Roaster-barista hybrid. Happy dialing in a new single origin or running your whole bar.",
    years: 7,
    rate: 2800,
    rates: [{ label: "Roastery cover", cents: 3400 }],
    signature: "Turkish-spiced cold brew",
    instagram: "karim.roasts",
    skills: ["espresso", "roasting", "cupping", "opening_closing"],
    weekly: [0, 1, 4, 5],
  },
  {
    email: "sofia.ricci@baristagigs.dev",
    name: "Sofia Ricci",
    bio: "Grew up behind a Milanese banco. Traditional espresso, modern manners, very fast hands.",
    years: 3,
    rate: 2100,
    rates: [{ label: "Events & catering", cents: 2600 }],
    signature: "Marocchino",
    instagram: "sofia.banco",
    skills: ["espresso", "service"],
    weekly: [2, 3, 4, 5, 6],
  },
];

// These three worked a (seeded) past shift at Lueur Coffee and get recommended.
const RECOMMENDED = [
  "lea.marchand@baristagigs.dev",
  "amara.diallo@baristagigs.dev",
  "nina.kowalska@baristagigs.dev",
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

const extraIdByEmail = new Map();

for (const barista of BARISTAS) {
  const userId = await ensureUser(barista.email);
  await admin.from("profiles").upsert({
    id: userId,
    role: "extra",
    display_name: barista.name,
    city_id: paris.id,
  });

  const values = {
    city_id: paris.id,
    bio: barista.bio,
    years_experience: barista.years,
    hourly_rate_cents: barista.rate,
    rates: barista.rates,
    signature_drink: barista.signature,
    instagram_handle: barista.instagram,
    skills: barista.skills,
    availability: { weekly: barista.weekly, blackoutDates: [] },
    is_available: true,
  };

  const { data: existing } = await admin
    .from("extras_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await admin.from("extras_profiles").update(values).eq("id", existing.id);
    extraIdByEmail.set(barista.email, existing.id);
  } else {
    const { data: created, error } = await admin
      .from("extras_profiles")
      .insert({ user_id: userId, ...values })
      .select("id")
      .single();
    if (error) throw error;
    extraIdByEmail.set(barista.email, created.id);
  }
  console.log("  barista: %s", barista.email);
}

// --- Past shift at the demo shop + recommendations ---------------------------
const { data: shop } = await admin
  .from("coffee_shops")
  .select("id")
  .eq("name", "Lueur Coffee")
  .maybeSingle();

if (!shop) {
  console.log("Demo shop (Lueur Coffee) not found — run seed:demo first to seed recommendations.");
} else {
  const gigTitle = "Fashion week pop-up (past shift)";
  const { data: existingGig } = await admin
    .from("announcements")
    .select("id")
    .eq("shop_id", shop.id)
    .eq("title", gigTitle)
    .maybeSingle();

  let gigId = existingGig?.id;
  if (!gigId) {
    const start = new Date();
    start.setDate(start.getDate() - 21);
    start.setHours(7, 0, 0, 0);
    const end = new Date(start);
    end.setHours(16, 0, 0, 0);
    const { data: gig, error } = await admin
      .from("announcements")
      .insert({
        shop_id: shop.id,
        city_id: paris.id,
        title: gigTitle,
        description:
          "Three extra baristas for our fashion week pop-up bar. High volume, VIP crowd, latte art on every cup.",
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        pay_rate_cents: 2800,
        pay_type: "hourly",
        required_skills: ["espresso", "latte_art", "service"],
        status: "filled",
      })
      .select("id")
      .single();
    if (error) throw error;
    gigId = gig.id;
  }

  for (const email of RECOMMENDED) {
    const extraId = extraIdByEmail.get(email);
    await admin.from("interests").upsert(
      {
        announcement_id: gigId,
        extra_id: extraId,
        message: "Worked the fashion week pop-up — seeded shift.",
        status: "accepted",
      },
      { onConflict: "announcement_id,extra_id" },
    );
    const { error } = await admin
      .from("recommendations")
      .upsert({ shop_id: shop.id, extra_id: extraId }, { onConflict: "shop_id,extra_id" });
    if (error) throw error;
    console.log("  recommended by Lueur Coffee: %s", email);
  }
}

console.log("Seeded %d Paris baristas (password: %s)", BARISTAS.length, PASSWORD);
