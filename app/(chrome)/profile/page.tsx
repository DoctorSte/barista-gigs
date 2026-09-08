import Link from "next/link";
import type { Metadata } from "next";
import { Eye, MapPin, ThumbsUp } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { CvUpload } from "@/components/cv-upload";
import { PassportLink } from "@/components/passport-link";
import { ExtraProfileForm } from "@/components/extra-profile-form";
import { PaymentDetailsForm } from "@/components/payment-details-form";
import { PortfolioManager } from "@/components/portfolio-manager";
import { ReferralLink } from "@/components/referral-link";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import { BARISTA_REFERRAL_BONUS_CENTS } from "@/lib/referrals";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { PortfolioPhoto, ReferralBonus } from "@/lib/database.types";
import { dateLocale, getDict, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const { user, profile, extra } = await requireExtra();
  const [city, supabase] = await Promise.all([getCityById(profile.city_id), createClient()]);

  const [{ data: photoData }, { data: recData }, { data: paymentData }] = await Promise.all([
    supabase.from("portfolio_photos").select("*").eq("extra_id", extra.id).order("sort_order"),
    supabase
      .from("recommendations")
      .select("id, created_at, coffee_shops(name)")
      .eq("extra_id", extra.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("extras_payment_details")
      .select("details")
      .eq("extra_id", extra.id)
      .maybeSingle(),
  ]);
  const d = await getDict();
  const loc = dateLocale(await getLocale());
  const photos = (photoData ?? []) as PortfolioPhoto[];
  const recommendations = (recData ?? []) as unknown as {
    id: string;
    created_at: string;
    coffee_shops: { name: string } | null;
  }[];

  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/`;

  // Referred cafés may live in other cities — read them via the service role.
  let referredCafes: { id: string; name: string; created_at: string }[] = [];
  if (hasAdminClient()) {
    const { data: referredData } = await createAdminClient()
      .from("coffee_shops")
      .select("id, name, created_at")
      .eq("referred_by_extra", extra.id)
      .order("created_at", { ascending: false });
    referredCafes = (referredData ?? []) as typeof referredCafes;
  }
  const { data: bonusData } = await supabase
    .from("referral_bonuses")
    .select("*")
    .eq("extra_id", extra.id);
  const bonuses = (bonusData ?? []) as ReferralBonus[];
  const bonusByShop = new Map(bonuses.map((b) => [b.shop_id, b]));
  const earnedCents = bonuses.reduce((sum, b) => sum + b.amount_cents, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{d.profile.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <MapPin className="size-4" />
            {d.profile.subtitle(city?.name ?? "…")}
          </p>
        </div>
        <Link
          href={`/cafe/baristas/${extra.id}`}
          className="pressable inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <Eye className="size-4" /> {d.profile.seeHowCafesSeeYou}
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <AvatarUpload userId={user.id} name={profile.display_name} avatarUrl={profile.avatar_url} />
        {profile.username ? <PassportLink username={profile.username} /> : null}
        {recommendations.length > 0 ? (
          <div className="rounded-lg border border-success/25 bg-success-soft px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <ThumbsUp className="size-4" />
              {d.profile.recommendedBy(
                recommendations.map((rec) => rec.coffee_shops?.name ?? "café").join(", "),
              )}
            </p>
            <p className="mt-0.5 text-[13px] text-success/80">
              {d.profile.recommendedHint}
            </p>
          </div>
        ) : null}
        <ExtraProfileForm profile={profile} extra={extra} />
        <PaymentDetailsForm details={paymentData?.details ?? ""} />
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {d.profile.referTitle(formatMoney(BARISTA_REFERRAL_BONUS_CENTS, "EUR"))}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.profile.referSub(formatMoney(BARISTA_REFERRAL_BONUS_CENTS, "EUR"))}
          </p>
          <div className="mt-4">
            <ReferralLink code={extra.referral_code} />
          </div>
          {referredCafes.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium">
                {d.profile.referJoined(
                  referredCafes.length,
                  earnedCents > 0 ? formatMoney(earnedCents, "EUR") : "",
                )}
              </p>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {referredCafes.map((cafe) => {
                  const bonus = bonusByShop.get(cafe.id);
                  return (
                    <li
                      key={cafe.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {cafe.name}
                        <span className="text-[12px] text-muted-foreground">
                          {d.profile.joinedOn(formatDate(cafe.created_at, loc))}
                        </span>
                      </span>
                      {bonus ? (
                        <Badge tone="success">
                          {formatMoney(bonus.amount_cents, "EUR")}{" "}
                          {bonus.status === "paid" ? d.profile.bonusPaid : d.profile.bonusOnWay}
                        </Badge>
                      ) : (
                        <Badge>{d.profile.notSubscribedYet}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
        <CvUpload userId={user.id} cvPath={extra.cv_path} cvFilename={extra.cv_filename} />
        <PortfolioManager
          userId={user.id}
          photos={photos.map((photo) => ({
            id: photo.id,
            caption: photo.caption,
            url: `${publicBase}${photo.storage_path}`,
          }))}
        />
      </div>
    </div>
  );
}
