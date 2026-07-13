import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  let conversationsQuery = supabase
    .from("conversations")
    .select("id, created_at, announcements(title), coffee_shops(name), extras_profiles(profiles(display_name))")
    .order("created_at", { ascending: false });

  if (profile?.role === "extra") {
    const { data: extra } = await supabase
      .from("extras_profiles")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (extra) {
      conversationsQuery = conversationsQuery.eq("extra_id", extra.id);
    }
  } else if (profile?.role === "shop") {
    const { data: shop } = await supabase
      .from("coffee_shops")
      .select("id")
      .eq("owner_id", profile.id)
      .maybeSingle();
    if (shop) {
      conversationsQuery = conversationsQuery.eq("shop_id", shop.id);
    }
  }

  const { data: conversations } = await conversationsQuery;

  return (
    <PageShell title="Messages" description="Coordinate gigs with shops and baristas.">
      <div className="grid gap-3">
        {!conversations?.length ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">
            No conversations yet. Express interest on a gig to start chatting.
          </p>
        ) : (
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-400"
            >
              <p className="font-medium">
                {relationOne(conversation.announcements)?.title}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {relationOne(conversation.coffee_shops)?.name} ·{" "}
                {relationOne(relationOne(conversation.extras_profiles)?.profiles)?.display_name}
              </p>
            </Link>
          ))
        )}
      </div>
    </PageShell>
  );
}
