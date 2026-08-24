import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, AtSign, Eye, Send, ThumbsUp } from "lucide-react";
import { getExtraProfile, getShop, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { skillLabel, WEEKDAYS } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InviteForm } from "@/components/invite-form";
import type { ExtraProfile, PortfolioPhoto } from "@/lib/database.types";

export const metadata: Metadata = { title: "Barista profile" };

type BaristaRow = ExtraProfile & {
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export default async function BaristaProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireProfile();

  // Cafés browse any barista; a barista can open only their own profile here,
  // as a preview of what cafés see.
  const shop = profile.role === "shop" ? await getShop() : null;
  if (profile.role === "shop" && !shop) redirect("/onboarding");
  const isSelfPreview = profile.role === "extra";
  if (isSelfPreview) {
    const ownExtra = await getExtraProfile();
    if (!ownExtra || ownExtra.id !== id) redirect("/profile");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("extras_profiles")
    .select("*, profiles:user_id(display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();
  const barista = data as unknown as BaristaRow | null;
  if (!barista) notFound();

  const nowIso = new Date().toISOString();
  const [{ data: photoData }, { data: recData }, { data: gigData }, { data: interestData }] =
    await Promise.all([
      supabase
        .from("portfolio_photos")
        .select("storage_path, caption, sort_order")
        .eq("extra_id", barista.id)
        .order("sort_order"),
      supabase
        .from("recommendations")
        .select("*, coffee_shops(name)")
        .eq("extra_id", barista.id)
        .order("created_at", { ascending: false }),
      shop
        ? supabase
            .from("announcements")
            .select("id, title")
            .eq("shop_id", shop.id)
            .eq("status", "open")
            .gte("ends_at", nowIso)
            .order("starts_at")
        : Promise.resolve({ data: [] }),
      shop
        ? supabase.from("interests").select("announcement_id").eq("extra_id", barista.id)
        : Promise.resolve({ data: [] }),
    ]);

  const photos = (photoData ?? []) as Pick<
    PortfolioPhoto,
    "storage_path" | "caption" | "sort_order"
  >[];
  const recommendations = (recData ?? []) as unknown as {
    id: string;
    coffee_shops: { name: string } | null;
  }[];
  const openGigs = (gigData ?? []) as { id: string; title: string }[];
  const alreadyAppliedGigIds = (interestData ?? []).map((row) => row.announcement_id as string);

  const name = barista.profiles?.display_name ?? "Barista";
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/`;
  const availableDays = (barista.availability?.weekly ?? [])
    .filter((w) => w.day >= 0 && w.day < WEEKDAYS.length)
    .sort((a, b) => a.day - b.day)
    .map((w) => `${WEEKDAYS[w.day]} ${w.start}–${w.end}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={isSelfPreview ? "/profile" : "/cafe/baristas"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {isSelfPreview ? "Back to my profile" : "All baristas"}
      </Link>

      {isSelfPreview ? (
        <p className="bubble-in mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          Preview — this is how cafés see your profile.
        </p>
      ) : null}

      <div className="rise-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={name} src={barista.profiles?.avatar_url} className="size-14 text-lg" />
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">{name}</h1>
              <p className="mt-0.5 text-[15px] text-muted-foreground">
                {[
                  barista.years_experience != null
                    ? `${barista.years_experience} yrs experience`
                    : null,
                  availableDays.length > 0
                    ? `usually available ${availableDays.join(", ")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Barista in your city"}
              </p>
            </div>
          </div>
          {barista.hourly_rate_cents != null ? (
            <span className="rounded-md bg-accent-soft px-3 py-1.5 text-lg font-semibold text-accent">
              {formatMoney(barista.hourly_rate_cents, barista.currency)}/hr
            </span>
          ) : null}
        </div>

        {barista.bio ? (
          <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">{barista.bio}</p>
        ) : null}

        {barista.skills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {barista.skills.map((skill) => (
              <Badge key={skill}>{skillLabel(skill)}</Badge>
            ))}
          </div>
        ) : null}

        {barista.rates.length > 0 || barista.signature_drink || barista.instagram_handle ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {barista.rates.map((rate) => (
              <span key={rate.label}>
                {rate.label} {formatMoney(rate.cents, barista.currency)}/hr
              </span>
            ))}
            {barista.signature_drink ? <span>Signature: {barista.signature_drink}</span> : null}
            {barista.instagram_handle ? (
              <a
                href={`https://instagram.com/${barista.instagram_handle}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-foreground"
              >
                <AtSign className="size-4" />
                {barista.instagram_handle}
              </a>
            ) : null}
          </div>
        ) : null}

        {recommendations.length > 0 ? (
          <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm font-medium text-success">
            <ThumbsUp className="size-4 shrink-0" />
            Recommended by{" "}
            {recommendations
              .map((rec) => rec.coffee_shops?.name ?? "a coffee shop")
              .join(", ")}
          </p>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <section className="rise-in mt-10 [animation-delay:80ms]">
          <h2 className="mb-3 font-display text-xl font-semibold">Portfolio</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <figure key={photo.storage_path}>
                <Image
                  src={`${publicBase}${photo.storage_path}`}
                  alt={photo.caption ?? `Portfolio photo by ${name}`}
                  width={480}
                  height={480}
                  className="aspect-square w-full rounded-md border border-border object-cover"
                />
                {photo.caption ? (
                  <figcaption className="mt-1.5 text-[13px] text-muted-foreground">
                    {photo.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {isSelfPreview ? null : (
      <section className="rise-in mt-10 [animation-delay:140ms]">
        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Send className="size-4 text-muted-foreground" />
            Invite to apply
          </h2>
          {openGigs.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Nudge {name} towards one of your open gigs — they&apos;ll get a notification.
              </p>
              <div className="mt-4">
                <InviteForm
                  extraId={barista.id}
                  gigs={openGigs}
                  alreadyAppliedGigIds={alreadyAppliedGigIds}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              You have no open gigs right now.{" "}
              <Link
                href="/cafe/dashboard"
                className="font-medium text-accent transition-colors duration-150 hover:underline"
              >
                Post one from your dashboard
              </Link>{" "}
              to invite {name}.
            </p>
          )}
        </Card>
      </section>
      )}
    </div>
  );
}
