import { notFound } from "next/navigation";
import { InterestForm } from "@/components/interest-form";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, formatMoney } from "@/lib/utils";

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: gig } = await supabase
    .from("announcements")
    .select("*, coffee_shops(name, address, machines)")
    .eq("id", id)
    .maybeSingle();

  if (!gig) notFound();

  return (
    <PageShell title={gig.title} description={formatDateRange(gig.starts_at, gig.ends_at)}>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            {relationOne(gig.coffee_shops)?.name} · {relationOne(gig.coffee_shops)?.address}
          </p>
          <p className="text-lg font-medium">
            {formatMoney(gig.pay_rate_cents)} {gig.pay_type}
          </p>
          <p className="whitespace-pre-wrap text-stone-700">{gig.description}</p>
          <p className="text-sm text-stone-500">
            Machines: {(relationOne(gig.coffee_shops)?.machines ?? []).join(", ")}
          </p>
          <p className="text-sm text-stone-500">
            Skills: {gig.required_skills.join(", ") || "None specified"}
          </p>
        </section>
        {profile?.role === "extra" ? (
          <InterestForm announcementId={gig.id} />
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
            Sign in as an extra to express interest.
          </div>
        )}
      </div>
    </PageShell>
  );
}
