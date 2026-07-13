import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, formatMoney } from "@/lib/utils";

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function GigsPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: gigs } = await supabase
    .from("announcements")
    .select("*, coffee_shops(name, address)")
    .eq("status", "open")
    .eq("city_id", profile?.city_id ?? "")
    .order("starts_at", { ascending: true });

  return (
    <PageShell
      title="Search gigs"
      description="Open announcements from coffee shops in your selected city."
    >
      <div className="grid gap-4">
        {!gigs?.length ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">
            No open gigs in this city yet.
          </p>
        ) : (
          gigs.map((gig) => (
            <Link
              key={gig.id}
              href={`/gigs/${gig.id}`}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{gig.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {relationOne(gig.coffee_shops)?.name} ·{" "}
                    {relationOne(gig.coffee_shops)?.address}
                  </p>
                </div>
                <p className="text-sm font-medium text-stone-800">
                  {formatMoney(gig.pay_rate_cents)} {gig.pay_type}
                </p>
              </div>
              <p className="mt-3 line-clamp-2 text-stone-700">{gig.description}</p>
              <p className="mt-3 text-sm text-stone-500">
                {formatDateRange(gig.starts_at, gig.ends_at)}
              </p>
            </Link>
          ))
        )}
      </div>
    </PageShell>
  );
}
