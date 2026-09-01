import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GigForm } from "@/components/gig-form";
import { Card } from "@/components/ui/card";
import type { Announcement } from "@/lib/database.types";

export const metadata: Metadata = { title: "Post a gig" };

export default async function NewGigPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; invite?: string }>;
}) {
  const [{ shop }, params] = await Promise.all([requireShop(), searchParams]);
  const supabase = await createClient();

  // Rebooking: prefill from a previous gig and auto-invite the barista.
  let template: Announcement | undefined;
  let inviteName: string | undefined;
  if (params.from) {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", params.from)
      .eq("shop_id", shop.id)
      .maybeSingle();
    template = (data as Announcement | null) ?? undefined;
  }
  if (params.invite) {
    const { data } = await supabase
      .from("extras_profiles")
      .select("id, profiles:user_id(display_name)")
      .eq("id", params.invite)
      .maybeSingle();
    inviteName = (data as unknown as { profiles: { display_name: string } | null } | null)
      ?.profiles?.display_name;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/cafe/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight">Post a gig</h1>
      <p className="mb-8 text-[15px] text-muted-foreground">
        It goes live to every barista in your city the moment you publish.
      </p>
      <Card>
        <GigForm
          mode="shift"
          template={template}
          inviteExtraId={params.invite}
          inviteName={inviteName}
          openingHours={shop.opening_hours}
        />
      </Card>
    </div>
  );
}
