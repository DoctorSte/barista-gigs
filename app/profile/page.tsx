import Link from "next/link";
import type { Metadata } from "next";
import { Eye, MapPin, ThumbsUp } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { CvUpload } from "@/components/cv-upload";
import { ExtraProfileForm } from "@/components/extra-profile-form";
import { PaymentDetailsForm } from "@/components/payment-details-form";
import { PortfolioManager } from "@/components/portfolio-manager";
import type { PortfolioPhoto } from "@/lib/database.types";

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
  const photos = (photoData ?? []) as PortfolioPhoto[];
  const recommendations = (recData ?? []) as unknown as {
    id: string;
    created_at: string;
    coffee_shops: { name: string } | null;
  }[];

  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My profile</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <MapPin className="size-4" />
            {city?.name ?? "Your city"} — this is what cafés see when you apply.
          </p>
        </div>
        <Link
          href={`/cafe/baristas/${extra.id}`}
          className="pressable inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <Eye className="size-4" /> See how cafés see you
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <AvatarUpload userId={user.id} name={profile.display_name} avatarUrl={profile.avatar_url} />
        {recommendations.length > 0 ? (
          <div className="rounded-lg border border-success/25 bg-success-soft px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <ThumbsUp className="size-4" />
              Recommended by{" "}
              {recommendations.map((rec) => rec.coffee_shops?.name ?? "a coffee shop").join(", ")}
            </p>
            <p className="mt-0.5 text-[13px] text-success/80">
              Shops you worked for can vouch for you — it shows on your applications.
            </p>
          </div>
        ) : null}
        <ExtraProfileForm profile={profile} extra={extra} />
        <PaymentDetailsForm details={paymentData?.details ?? ""} />
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
