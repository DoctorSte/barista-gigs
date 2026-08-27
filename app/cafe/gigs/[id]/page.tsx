import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Users } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { GigForm } from "@/components/gig-form";
import { GigStatusControl } from "@/components/gig-status-control";
import { ApplicantList, type ApplicantRow } from "@/components/applicant-list";
import { GigStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Announcement } from "@/lib/database.types";

export const metadata: Metadata = { title: "Manage gig" };

export default async function ManageGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await requireShop();
  const supabase = await createClient();

  const { data: gigData } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shop.id)
    .maybeSingle();
  const gig = gigData as Announcement | null;
  if (!gig) notFound();

  const [{ data: interestData }, { data: conversationData }] = await Promise.all([
    supabase
      .from("interests")
      .select(
        "*, extras_profiles(id, bio, years_experience, hourly_rate_cents, currency, rates, signature_drink, instagram_handle, cv_path, cv_filename, skills, profiles:user_id(display_name, avatar_url))",
      )
      .eq("announcement_id", gig.id)
      .order("created_at"),
    supabase.from("conversations").select("id, extra_id").eq("announcement_id", gig.id),
  ]);

  const applicants = (interestData ?? []) as unknown as ApplicantRow[];
  const conversationByExtra = new Map((conversationData ?? []).map((c) => [c.extra_id, c.id]));

  const extraIds = applicants.map((a) => a.extras_profiles?.id).filter(Boolean) as string[];
  const { data: recData } = extraIds.length
    ? await supabase
        .from("recommendations")
        .select("extra_id, shop_id, coffee_shops(name)")
        .in("extra_id", extraIds)
    : { data: [] };
  const recommendationsByExtra: Record<string, { shopNames: string[]; mine: boolean }> = {};
  for (const rec of (recData ?? []) as unknown as {
    extra_id: string;
    shop_id: string;
    coffee_shops: { name: string } | null;
  }[]) {
    const entry = (recommendationsByExtra[rec.extra_id] ??= { shopNames: [], mine: false });
    entry.shopNames.push(rec.coffee_shops?.name ?? "A coffee shop");
    if (rec.shop_id === shop.id) entry.mine = true;
  }

  // RLS limits this to interests on this shop's gigs, so it counts shifts worked here.
  const { data: workedData } = extraIds.length
    ? await supabase
        .from("interests")
        .select("extra_id, announcements!inner(ends_at)")
        .eq("status", "accepted")
        .in("extra_id", extraIds)
    : { data: [] };
  const nowIso = new Date().toISOString();
  const workedByExtra: Record<string, number> = {};
  for (const row of (workedData ?? []) as unknown as {
    extra_id: string;
    announcements: { ends_at: string } | null;
  }[]) {
    if (row.announcements && row.announcements.ends_at < nowIso) {
      workedByExtra[row.extra_id] = (workedByExtra[row.extra_id] ?? 0) + 1;
    }
  }

  const acceptedExtraIds = applicants
    .filter((a) => a.status === "accepted" && a.extras_profiles)
    .map((a) => a.extras_profiles!.id);
  const { data: paymentData } = acceptedExtraIds.length
    ? await supabase
        .from("extras_payment_details")
        .select("extra_id, details")
        .in("extra_id", acceptedExtraIds)
    : { data: [] };
  const paymentByExtra: Record<string, string> = {};
  for (const row of (paymentData ?? []) as { extra_id: string; details: string }[]) {
    if (row.details) paymentByExtra[row.extra_id] = row.details;
  }

  // CVs are in a private bucket — sign short-lived URLs for applicants that have one.
  const cvByExtra: Record<string, { url: string; filename: string }> = {};
  if (hasAdminClient()) {
    const admin = createAdminClient();
    for (const applicant of applicants) {
      const extra = applicant.extras_profiles;
      if (!extra?.cv_path) continue;
      const { data: signed } = await admin.storage.from("cvs").createSignedUrl(extra.cv_path, 3600);
      if (signed?.signedUrl) {
        cvByExtra[extra.id] = { url: signed.signedUrl, filename: extra.cv_filename ?? "CV" };
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/cafe/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate font-display text-3xl font-semibold tracking-tight">
            {gig.title}
          </h1>
          <GigStatusBadge status={gig.status} />
        </div>
        <GigStatusControl gigId={gig.id} status={gig.status} />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold">
          <Users className="size-5 text-muted-foreground" />
          Applicants
          <span className="text-base font-normal text-muted-foreground">
            {applicants.length}
          </span>
        </h2>
        <ApplicantList
          applicants={applicants}
          conversationByExtra={Object.fromEntries(conversationByExtra)}
          recommendationsByExtra={recommendationsByExtra}
          workedByExtra={workedByExtra}
          paymentByExtra={paymentByExtra}
          cvByExtra={cvByExtra}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Edit gig</h2>
        <Card>
          <GigForm gig={gig} openingHours={shop.opening_hours} />
        </Card>
      </section>
    </div>
  );
}
