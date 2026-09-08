import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { getExtraProfile, getShop, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Conversation } from "@/lib/database.types";
import { dateLocale, getDict, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Messages" };

type ConversationRow = Conversation & {
  announcements: { title: string } | null;
  coffee_shops: { name: string } | null;
  extras_profiles: { profiles: { display_name: string } | null } | null;
};

export default async function MessagesPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("conversations")
    .select(
      "*, announcements(title), coffee_shops(name), extras_profiles(profiles:user_id(display_name))",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (profile.role === "shop") {
    const shop = await getShop();
    query = query.eq("shop_id", shop?.id ?? "00000000-0000-0000-0000-000000000000");
  } else {
    const extra = await getExtraProfile();
    query = query.eq("extra_id", extra?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data } = await query;
  const d = await getDict();
  const loc = dateLocale(await getLocale());
  const conversations = (data ?? []) as unknown as ConversationRow[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{d.messages.title}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {profile.role === "shop"
            ? d.messages.subShop
            : d.messages.subExtra}
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={d.messages.empty}
          description={
            profile.role === "shop"
              ? d.messages.emptySubShop2
              : d.messages.emptySubExtra2
          }
        />
      ) : (
        <ul className="stagger flex flex-col gap-2">
          {conversations.map((conversation) => {
            const counterpart =
              profile.role === "shop"
                ? conversation.extras_profiles?.profiles?.display_name ?? "Barista"
                : conversation.coffee_shops?.name ?? "Coffee shop";
            return (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="pressable flex items-center gap-3.5 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
                >
                  <Avatar name={counterpart} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{counterpart}</p>
                      {conversation.last_message_at ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(conversation.last_message_at, loc)}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.last_message_preview ??
                        `About: ${conversation.announcements?.title ?? "a gig"}`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
