import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { languageLabel, skillLabel } from "@/lib/constants";
import type { ExtraProfile, PortfolioPhoto, Profile } from "@/lib/database.types";

// The Barista Passport: a public, shareable travel document. Cafés are
// countries, shifts are border crossings, latte art is postage. Rendered with
// the service role — setting a username is the barista's explicit opt-in.

type CafeStampData = { name: string; count: number; lastDate: string };

const INKS = ["#a63b2a", "#2a5da6", "#3e7a4e", "#7a4e8f", "#8a6b1f"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}

function mrzify(text: string, length: number) {
  const clean = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "<");
  return (clean + "<".repeat(length)).slice(0, length);
}

async function loadPassport(username: string) {
  if (!hasAdminClient()) return null;
  const admin = createAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("role", "extra")
    .maybeSingle();
  const profile = profileData as Profile | null;
  if (!profile) return null;

  const { data: extraData } = await admin
    .from("extras_profiles")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();
  const extra = extraData as ExtraProfile | null;
  if (!extra) return null;

  const nowIso = new Date().toISOString();
  const [{ data: photos }, { data: recs }, { data: worked }, { data: city }] = await Promise.all([
    admin
      .from("portfolio_photos")
      .select("storage_path, caption")
      .eq("extra_id", extra.id)
      .order("sort_order"),
    admin.from("recommendations").select("id, coffee_shops(name)").eq("extra_id", extra.id),
    admin
      .from("interests")
      .select("id, announcements!inner(ends_at, coffee_shops(name))")
      .eq("extra_id", extra.id)
      .eq("status", "accepted"),
    admin.from("cities").select("name").eq("id", extra.city_id).maybeSingle(),
  ]);

  // Café stamps: one per café, counting completed shifts there.
  const stamps = new Map<string, CafeStampData>();
  for (const row of (worked ?? []) as unknown as {
    announcements: { ends_at: string; coffee_shops: { name: string } | null };
  }[]) {
    if (row.announcements.ends_at >= nowIso) continue;
    const name = row.announcements.coffee_shops?.name ?? "A café";
    const existing = stamps.get(name);
    if (existing) {
      existing.count += 1;
      if (row.announcements.ends_at > existing.lastDate) {
        existing.lastDate = row.announcements.ends_at;
      }
    } else {
      stamps.set(name, { name, count: 1, lastDate: row.announcements.ends_at });
    }
  }

  return {
    profile,
    extra,
    photos: (photos ?? []) as Pick<PortfolioPhoto, "storage_path" | "caption">[],
    recommendations: (
      (recs ?? []) as unknown as { id: string; coffee_shops: { name: string } | null }[]
    ).map((r) => r.coffee_shops?.name ?? "a café"),
    cafeStamps: [...stamps.values()].sort((a, b) => b.count - a.count),
    shiftsWorked: [...stamps.values()].reduce((sum, s) => sum + s.count, 0),
    cityName: (city as { name: string } | null)?.name ?? null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const passport = await loadPassport(username);
  return {
    title: passport ? `${passport.profile.display_name} — Barista Passport` : "Barista Passport",
    description: passport
      ? `${passport.profile.display_name}'s verified barista passport on Barista Gigs.`
      : undefined,
  };
}

function stampDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function CafeStamp({ stamp, index }: { stamp: CafeStampData; index: number }) {
  const h = hash(stamp.name);
  const ink = INKS[h % INKS.length];
  const rotation = ((h % 17) - 8) * 1.4;
  const arcId = `pp-arc-${index}`;
  const arcText = `★ ${stamp.name.toUpperCase().slice(0, 26)} ★ BARISTA GIGS `;

  return (
    <div
      className="pp-tilt"
      style={{ transform: `rotate(${rotation}deg)`, marginTop: `${(h % 3) * 8}px` }}
    >
      <svg
        viewBox="0 0 170 170"
        className="size-36 mix-blend-multiply sm:size-40"
        style={{ opacity: 0.85, filter: "url(#pp-rough)" }}
        role="img"
        aria-label={`Stamp: ${stamp.count} shift${stamp.count === 1 ? "" : "s"} at ${stamp.name}`}
      >
        <defs>
          <path id={arcId} d="M 85 85 m -60 0 a 60 60 0 1 1 120 0 a 60 60 0 1 1 -120 0" />
        </defs>
        <circle cx="85" cy="85" r="78" fill="none" stroke={ink} strokeWidth="3.5" />
        <circle cx="85" cy="85" r="44" fill="none" stroke={ink} strokeWidth="1.2" strokeDasharray="3 3" />
        <text fill={ink} fontSize="11.5" fontWeight="700" letterSpacing="2.5" fontFamily="ui-monospace, monospace">
          <textPath href={`#${arcId}`} startOffset="0">
            {arcText}
          </textPath>
        </text>
        <text x="85" y="70" textAnchor="middle" fill={ink} fontSize="9" letterSpacing="2" fontFamily="ui-monospace, monospace">
          SHIFT{stamp.count === 1 ? "" : "S"} WORKED
        </text>
        <text x="85" y="99" textAnchor="middle" fill={ink} fontSize="30" fontWeight="700" fontFamily="var(--font-clash-display), sans-serif">
          ×{stamp.count}
        </text>
        <text x="85" y="118" textAnchor="middle" fill={ink} fontSize="9.5" letterSpacing="1.5" fontFamily="ui-monospace, monospace">
          {stampDate(stamp.lastDate)}
        </text>
      </svg>
    </div>
  );
}

function LatteStamp({
  src,
  caption,
  index,
  name,
}: {
  src: string;
  caption: string | null;
  index: number;
  name: string;
}) {
  const rotation = ((hash(src) % 11) - 5) * 1.2;
  return (
    <figure
      className="pp-tilt relative aspect-[4/5] w-36 sm:w-40"
      style={{ transform: `rotate(${rotation}deg)`, marginTop: `${(index % 3) * 6}px` }}
    >
      <div className="pp-perf absolute inset-0 bg-[#fbf6ea] shadow-[0_6px_16px_-8px_rgba(43,36,23,0.5)]" />
      <div className="absolute inset-[11px] bottom-[30px] overflow-hidden border border-[#d8cbae]">
        <Image
          src={src}
          alt={caption ?? `Latte art by ${name}`}
          fill
          sizes="160px"
          className="pp-stamp-photo object-cover"
        />
      </div>
      <span className="pp-label absolute left-[11px] top-[13px] z-10 rounded-sm bg-[#fbf6ea]/85 px-1 !text-[8px]">
        BARISTA POST
      </span>
      <span className="absolute right-[10px] top-[10px] z-10 rounded-sm bg-[#fbf6ea]/85 px-1 font-mono text-[10px] font-bold text-[#a63b2a]">
        1☕
      </span>
      <figcaption className="pp-label absolute inset-x-[11px] bottom-[12px] truncate text-center !text-[8px]">
        {(caption ?? "LATTE ART").toUpperCase()}
      </figcaption>
    </figure>
  );
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const passport = await loadPassport(username);
  if (!passport) notFound();

  const { profile, extra, photos, recommendations, cafeStamps, shiftsWorked, cityName } = passport;
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/`;
  const nameParts = profile.display_name.trim().split(/\s+/);
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  const given = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "—";
  const memberSince = new Date(profile.created_at);
  const passportNo = `BG${String(hash(profile.id) * 7919).padStart(7, "0").slice(0, 7)}`;
  const mrz1 = mrzify(`P<BGIGS<${surname}<<${given}`, 44);
  const mrz2 = mrzify(
    `${profile.username ?? ""}<${passportNo}<${cityName ?? ""}<${memberSince.getFullYear()}<S${shiftsWorked}R${recommendations.length}`,
    44,
  );

  return (
    <div className="pp-scene min-h-dvh px-4 py-10 sm:py-16">
      {/* Shared rubber-stamp roughness filter */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <filter id="pp-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
        </filter>
      </svg>

      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        {/* ------ COVER ------ */}
        <section className="pp-cover rise-in rounded-2xl px-8 py-12 text-center">
          <p className="pp-foil font-mono text-[10px] tracking-[0.5em]">REPUBLIQUE DU CAFE</p>
          <div className="pp-foil-rule mx-auto mt-4 h-px w-40" />
          <h1 className="pp-foil mt-8 font-display text-4xl font-semibold leading-tight tracking-wide">
            BARISTA
            <br />
            PASSPORT
          </h1>
          <div className="mx-auto mt-8 flex size-24 items-center justify-center rounded-full border border-[#d4b36a]/50">
            <Image
              src="/mascot.png"
              alt=""
              width={64}
              height={59}
              className="size-14 object-contain opacity-90 [filter:sepia(1)_saturate(2.2)_hue-rotate(-12deg)_brightness(1.15)]"
            />
          </div>
          <div className="pp-foil-rule mx-auto mb-4 mt-8 h-px w-40" />
          <p className="pp-foil font-mono text-[10px] tracking-[0.4em]">BARISTA GIGS</p>
          <div className="mx-auto mt-6 h-8 w-11 rounded-md border border-[#d4b36a]/60 bg-gradient-to-br from-[#d4b36a]/30 to-transparent" aria-hidden />
        </section>

        {/* ------ IDENTIFICATION PAGE ------ */}
        <section className="pp-page rise-in overflow-hidden rounded-lg [animation-delay:80ms]">
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="pp-label">IDENTIFICATION PAGE</p>
            <p className="pp-label">{passportNo}</p>
          </div>
          <div className="flex gap-5 px-5 pb-4 pt-3">
            <div className="relative size-28 shrink-0 border border-[#c9b892] bg-[#e9dfc8] p-1">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={112}
                  height={112}
                  className="size-full object-cover [filter:saturate(0.85)_contrast(1.05)]"
                />
              ) : (
                <div className="flex size-full items-center justify-center font-display text-3xl font-semibold text-[#6b5f49]">
                  {profile.display_name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <span className="absolute -left-px -top-px size-2.5 border-l-2 border-t-2 border-[#6b5f49]" />
              <span className="absolute -bottom-px -right-px size-2.5 border-b-2 border-r-2 border-[#6b5f49]" />
            </div>
            <dl className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-2.5">
              <div className="col-span-2">
                <dt className="pp-label">SURNAME / GIVEN NAMES</dt>
                <dd className="font-display text-lg font-semibold leading-tight">
                  {surname.toUpperCase()}, {given}
                </dd>
              </div>
              <div>
                <dt className="pp-label">TYPE</dt>
                <dd className="text-sm font-semibold">BARISTA</dd>
              </div>
              <div>
                <dt className="pp-label">CODE</dt>
                <dd className="text-sm font-semibold">@{profile.username}</dd>
              </div>
              <div>
                <dt className="pp-label">BASE</dt>
                <dd className="text-sm font-semibold">{cityName ?? "—"}</dd>
              </div>
              <div>
                <dt className="pp-label">ISSUED</dt>
                <dd className="text-sm font-semibold">
                  {memberSince.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-dashed border-[#c9b892] px-5 py-4">
            <div>
              <dt className="pp-label">RATE</dt>
              <dd className="text-sm font-semibold">
                {extra.hourly_rate_cents != null
                  ? `${formatMoney(extra.hourly_rate_cents, extra.currency)}/HR`
                  : "ON REQUEST"}
              </dd>
            </div>
            <div>
              <dt className="pp-label">EXPERIENCE</dt>
              <dd className="text-sm font-semibold">
                {extra.years_experience != null ? `${extra.years_experience} YEARS` : "—"}
              </dd>
            </div>
            {extra.languages.length > 0 ? (
              <div className="col-span-2">
                <dt className="pp-label">LANGUAGES</dt>
                <dd className="text-sm font-semibold">
                  {extra.languages.map(languageLabel).join(" · ")}
                </dd>
              </div>
            ) : null}
            {extra.skills.length > 0 ? (
              <div className="col-span-2">
                <dt className="pp-label">ENDORSEMENTS</dt>
                <dd className="text-sm font-semibold">
                  {extra.skills.map(skillLabel).join(" · ").toUpperCase()}
                </dd>
              </div>
            ) : null}
            {extra.signature_drink ? (
              <div className="col-span-2">
                <dt className="pp-label">SIGNATURE POUR</dt>
                <dd className="font-display text-sm italic">{extra.signature_drink}</dd>
              </div>
            ) : null}
          </div>

          {recommendations.length > 0 ? (
            <div className="flex items-center gap-3 border-t border-dashed border-[#c9b892] px-5 py-3">
              <svg viewBox="0 0 48 48" className="size-11 shrink-0" aria-hidden>
                <circle cx="24" cy="24" r="19" fill="none" stroke="#9c7c3c" strokeWidth="7" strokeDasharray="1 6" strokeLinecap="round" />
                <circle cx="24" cy="24" r="13" fill="none" stroke="#9c7c3c" strokeWidth="1" />
                <text x="24" y="29" textAnchor="middle" fontSize="14" fill="#9c7c3c">
                  ★
                </text>
              </svg>
              <p className="text-[13px] leading-snug text-[#6b5f49]">
                <span className="font-semibold text-[#2b2417]">Consular endorsement</span> — vouched
                for by {recommendations.join(", ")}.
              </p>
            </div>
          ) : null}

          <div className="pp-mrz px-5 py-3 text-[11px] leading-relaxed">
            <p>{mrz1}</p>
            <p>{mrz2}</p>
          </div>
        </section>

        {/* ------ ENTRY STAMPS ------ */}
        <section className="pp-page rise-in rounded-lg px-5 py-5 [animation-delay:140ms]">
          <div className="flex items-baseline justify-between">
            <p className="pp-label">ENTRIES · CAFES WORKED</p>
            <p className="pp-label">
              {shiftsWorked} {shiftsWorked === 1 ? "CROSSING" : "CROSSINGS"}
            </p>
          </div>
          {cafeStamps.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-start justify-center gap-x-2 gap-y-1 pb-2">
              {cafeStamps.map((stamp, index) => (
                <CafeStamp key={stamp.name} stamp={stamp} index={index} />
              ))}
            </div>
          ) : (
            <div className="my-6 flex justify-center">
              <div className="flex size-36 items-center justify-center rounded-full border-2 border-dashed border-[#c9b892] p-6 text-center">
                <p className="pp-label !text-[9px] leading-relaxed">
                  FIRST STAMP
                  <br />
                  AWAITS
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ------ LATTE ART / PHILATELIC SECTION ------ */}
        {photos.length > 0 ? (
          <section className="pp-page rise-in rounded-lg px-5 py-5 [animation-delay:200ms]">
            <div className="flex items-baseline justify-between">
              <p className="pp-label">PHILATELIC SECTION · LATTE ART</p>
              <p className="pp-label">{photos.length} ISSUED</p>
            </div>
            <div className="mt-4 flex flex-wrap items-start justify-center gap-4 pb-2">
              {photos.map((photo, index) => (
                <LatteStamp
                  key={photo.storage_path}
                  src={`${publicBase}${photo.storage_path}`}
                  caption={photo.caption}
                  index={index}
                  name={profile.display_name}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ------ BACK COVER ------ */}
        <section className="pp-cover rise-in rounded-2xl px-8 py-8 text-center [animation-delay:260ms]">
          <p className="pp-foil font-mono text-[10px] leading-relaxed tracking-[0.3em]">
            THE BEARER IS ENTITLED TO PULL SHOTS
            <br />
            AT ANY COUNTER THAT WILL HAVE THEM
          </p>
          <div className="mx-auto mt-6 max-w-xs -rotate-1 rounded-md bg-[#f5efe0] px-5 py-4 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)]">
            <p className="pp-label !text-[8px]">HIRING VISA · APPLY WITHIN</p>
            <p className="mt-1 font-display text-base font-semibold text-[#2b2417]">
              Want {given === "—" ? surname : given} behind your bar?
            </p>
            <Link
              href="/signup?role=shop"
              className="pressable mt-3 inline-flex h-9 items-center rounded-sm bg-[#1e3a2f] px-5 text-[13px] font-medium text-[#edd9a3]"
            >
              Join Barista Gigs
            </Link>
          </div>
          <p className="pp-foil mt-6 font-mono text-[10px] tracking-[0.4em]">BARISTAGIGS.COM</p>
        </section>
      </div>
    </div>
  );
}
