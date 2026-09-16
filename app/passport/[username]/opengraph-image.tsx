import { ImageResponse } from "next/og";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { crewTier } from "@/lib/crew";

// Share card for the Barista Passport: the passport cover, rendered as an
// image so links unfurl as the document itself — dark leatherette, foil
// lettering, the holder's numbers, and an MRZ strip for flavour.

export const alt = "Barista Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOIL = "#c9c9cf";
const FOIL_DIM = "#8e8e96";

function mrzify(text: string, length: number) {
  const clean = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "<");
  return (clean + "<".repeat(length)).slice(0, length);
}

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  let name = "Barista Passport";
  let city: string | null = null;
  let shifts = 0;
  let recommendations = 0;
  let crewRank: string | null = null;
  let memberSince: string | null = null;

  if (hasAdminClient()) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, display_name, created_at")
      .eq("username", username.toLowerCase())
      .eq("role", "extra")
      .maybeSingle();
    if (profile) {
      name = profile.display_name;
      memberSince = new Date(profile.created_at)
        .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
        .toUpperCase();
      const { data: extra } = await admin
        .from("extras_profiles")
        .select("id, city_id")
        .eq("user_id", profile.id)
        .maybeSingle();
      if (extra) {
        const nowIso = new Date().toISOString();
        const [{ data: cityRow }, { data: worked }, { count: recCount }, { count: crewCount }] =
          await Promise.all([
            admin.from("cities").select("name").eq("id", extra.city_id).maybeSingle(),
            admin
              .from("interests")
              .select("id, announcements!inner(ends_at)")
              .eq("extra_id", extra.id)
              .eq("status", "accepted"),
            admin
              .from("recommendations")
              .select("id", { count: "exact", head: true })
              .eq("extra_id", extra.id),
            admin
              .from("extras_profiles")
              .select("id", { count: "exact", head: true })
              .eq("referred_by_extra", extra.id),
          ]);
        city = (cityRow as { name: string } | null)?.name ?? null;
        shifts = ((worked ?? []) as unknown as { announcements: { ends_at: string } }[]).filter(
          (row) => row.announcements.ends_at < nowIso,
        ).length;
        recommendations = recCount ?? 0;
        const rank = crewTier(crewCount ?? 0).reached;
        crewRank = ["FIRST POUR", "MORNING CREW", "FULL BRIGADE", "GUILD"][rank - 1] ?? null;
      }
    }
  }

  const mrz1 = mrzify(`P<BGIGS<${name}`, 44);
  const mrz2 = mrzify(`${username}<${city ?? ""}<S${shifts}R${recommendations}`, 44);

  const fields: { label: string; value: string }[] = [
    { label: "BASE", value: city?.toUpperCase() ?? "—" },
    { label: "SHIFTS WORKED", value: String(shifts) },
    ...(recommendations > 0
      ? [
          {
            label: "VOUCHED FOR BY",
            value: `${recommendations} ${recommendations === 1 ? "CAFÉ" : "CAFÉS"}`,
          },
        ]
      : []),
    ...(crewRank ? [{ label: "DELEGATION", value: crewRank }] : []),
    ...(memberSince ? [{ label: "ISSUED", value: memberSince }] : []),
  ].slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0e0e10",
          backgroundImage:
            "radial-gradient(120% 100% at 18% 0%, rgba(255,255,255,0.08), transparent 48%), linear-gradient(160deg, #1c1c1f 0%, #0e0e10 100%)",
          padding: "64px 72px 0",
          color: FOIL,
        }}
      >
        {/* Frame line, like the cover's blind emboss */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: `2px solid rgba(201,201,207,0.28)`,
            borderRadius: 18,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            letterSpacing: 10,
            color: FOIL_DIM,
          }}
        >
          <span>BARISTA GIGS</span>
          <span>PASSEPORT DE BARISTA</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 68,
            flexGrow: 1,
          }}
        >
          <span style={{ fontSize: 30, letterSpacing: 14, color: FOIL_DIM }}>
            BARISTA PASSPORT
          </span>
          <span
            style={{
              marginTop: 18,
              fontSize: 84,
              fontWeight: 700,
              color: "#e8e8ec",
              letterSpacing: -1,
            }}
          >
            {name}
          </span>

          <div style={{ display: "flex", gap: 64, marginTop: 52 }}>
            {fields.map((field) => (
              <div key={field.label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 20, letterSpacing: 4, color: FOIL_DIM }}>
                  {field.label}
                </span>
                <span style={{ marginTop: 8, fontSize: 40, fontWeight: 700, color: FOIL }}>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MRZ strip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: `2px dashed rgba(201,201,207,0.35)`,
            margin: "0 -72px",
            padding: "26px 72px 34px",
            fontSize: 27,
            letterSpacing: 6,
            color: FOIL_DIM,
          }}
        >
          <span>{mrz1}</span>
          <span>{mrz2}</span>
        </div>
      </div>
    ),
    size,
  );
}
