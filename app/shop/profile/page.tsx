import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { AvatarUpload } from "@/components/avatar-upload";
import { ShopProfileForm } from "@/components/shop-profile-form";

export const metadata: Metadata = { title: "Shop profile" };

export default async function ShopProfilePage() {
  const { user, profile, shop } = await requireShop();
  const city = await getCityById(shop.city_id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Shop profile</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <MapPin className="size-4" />
          {city?.name ?? "Your city"} — this is what baristas see on your gigs.
        </p>
      </div>
      <div className="flex flex-col gap-10">
        <AvatarUpload userId={user.id} name={profile.display_name} avatarUrl={profile.avatar_url} />
        <ShopProfileForm shop={shop} />
      </div>
    </div>
  );
}
