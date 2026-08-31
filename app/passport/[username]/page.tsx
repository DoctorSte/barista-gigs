import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AtSign, CalendarCheck, MapPin, ThumbsUp } from "lucide-react";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { languageLabel, skillLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExtraProfile, PortfolioPhoto, Profile } from "@/lib/database.types";

// Public, shareable page. Rendered with the service role: setting a username
// is the barista's explicit opt-in to publishing this profile.

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
      .select("id, announcements!inner(ends_at)")
      .eq("extra_id", extra.id)
      .eq("status", "accepted"),
    admin.from("cities").select("name").eq("id", extra.city_id).maybeSingle(),
  ]);

  const shiftsWorked = ((worked ?? []) as unknown as { announcements: { ends_at: string } }[]).filter(
    (row) => row.announcements.ends_at < nowIso,
  ).length;

  return {
    profile,
    extra,
    photos: (photos ?? []) as Pick<PortfolioPhoto, "storage_path" | "caption">[],
    recommendations: ((recs ?? []) as unknown as { id: string; coffee_shops: { name: string } | null }[]).map(
      (r) => r.coffee_shops?.name ?? "a café",
    ),
    shiftsWorked,
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
      ? `${passport.profile.display_name}'s verified barista profile on Barista Gigs.`
      : undefined,
  };
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const passport = await loadPassport(username);
  if (!passport) notFound();

  const { profile, extra, photos, recommendations, shiftsWorked, cityName } = passport;
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rise-in flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} className="size-16 text-xl" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {profile.display_name}
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[15px] text-muted-foreground">
            <span>@{profile.username}</span>
            {cityName ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" /> {cityName}
              </span>
            ) : null}
            <span>
              on Barista Gigs since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="rise-in mt-6 grid grid-cols-3 gap-3 [animation-delay:60ms]">
        <Card className="p-4 text-center">
          <p className="font-display text-2xl font-semibold">{shiftsWorked}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <CalendarCheck className="size-3.5" /> shifts worked
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="font-display text-2xl font-semibold">{recommendations.length}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <ThumbsUp className="size-3.5" /> recommendations
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="font-display text-2xl font-semibold">
            {extra.years_experience != null ? extra.years_experience : "—"}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">years experience</p>
        </Card>
      </div>

      {extra.bio ? (
        <p className="rise-in mt-6 whitespace-pre-wrap text-[15px] leading-relaxed [animation-delay:100ms]">
          {extra.bio}
        </p>
      ) : null}

      <div className="rise-in mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground [animation-delay:120ms]">
        {extra.hourly_rate_cents != null ? (
          <span className="rounded-md bg-accent-soft px-2.5 py-1 font-semibold text-accent">
            {formatMoney(extra.hourly_rate_cents, extra.currency)}/hr
          </span>
        ) : null}
        {extra.languages.length > 0 ? (
          <span>speaks {extra.languages.map(languageLabel).join(", ")}</span>
        ) : null}
        {extra.signature_drink ? <span>Signature: {extra.signature_drink}</span> : null}
        {extra.instagram_handle ? (
          <a
            href={`https://instagram.com/${extra.instagram_handle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <AtSign className="size-4" />
            {extra.instagram_handle}
          </a>
        ) : null}
      </div>

      {extra.skills.length > 0 ? (
        <div className="rise-in mt-4 flex flex-wrap gap-1.5 [animation-delay:140ms]">
          {extra.skills.map((skill) => (
            <Badge key={skill}>{skillLabel(skill)}</Badge>
          ))}
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <p className="rise-in mt-6 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm font-medium text-success [animation-delay:160ms]">
          <ThumbsUp className="size-4 shrink-0" />
          Recommended by {recommendations.join(", ")}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="rise-in mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 [animation-delay:180ms]">
          {photos.map((photo) => (
            <Image
              key={photo.storage_path}
              src={`${publicBase}${photo.storage_path}`}
              alt={photo.caption ?? `Photo by ${profile.display_name}`}
              width={480}
              height={480}
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
          ))}
        </div>
      ) : null}

      <Card className="rise-in mt-10 flex flex-wrap items-center justify-between gap-4 [animation-delay:220ms]">
        <div>
          <p className="font-display text-lg font-semibold">
            Want {profile.display_name.split(" ")[0]} behind your bar?
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Barista Gigs connects cafés with freelance baristas for one-off shifts and jobs.
          </p>
        </div>
        <Link
          href="/signup?role=shop"
          className="pressable inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Join Barista Gigs
        </Link>
      </Card>
    </div>
  );
}
