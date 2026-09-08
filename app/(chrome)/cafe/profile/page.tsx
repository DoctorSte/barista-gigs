import Link from "next/link";
import type { Metadata } from "next";
import { Eye, MapPin } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { AvatarUpload } from "@/components/avatar-upload";
import { ShopProfileForm } from "@/components/shop-profile-form";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Café profile" };

export default async function ShopProfilePage() {
  const { user, profile, shop } = await requireShop();
  const city = await getCityById(shop.city_id);

  const d = await getDict();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{d.shopForm.profileTitle}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <MapPin className="size-4" />
            {d.shopForm.profileSub(city?.name ?? "…")}
          </p>
        </div>
        <Link
          href="/cafe/profile/preview"
          className="pressable inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <Eye className="size-4" /> See how baristas see you
        </Link>
      </div>
      <div className="flex flex-col gap-10">
        <AvatarUpload userId={user.id} name={profile.display_name} avatarUrl={profile.avatar_url} />
        <ShopProfileForm shop={shop} />
      </div>
    </div>
  );
}
