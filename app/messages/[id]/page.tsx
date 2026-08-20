import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { MessageThread } from "@/components/message-thread";
import type { Conversation, Message } from "@/lib/database.types";

export const metadata: Metadata = { title: "Conversation" };

type ConversationRow = Conversation & {
  announcements: { title: string } | null;
  coffee_shops: { name: string } | null;
  extras_profiles: { profiles: { display_name: string } | null } | null;
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireProfile();
  const supabase = await createClient();

  const { data: conversationData } = await supabase
    .from("conversations")
    .select(
      "*, announcements(title), coffee_shops(name), extras_profiles(profiles:user_id(display_name))",
    )
    .eq("id", id)
    .maybeSingle();
  const conversation = conversationData as unknown as ConversationRow | null;
  if (!conversation) notFound();

  const { data: messageData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at");
  const messages = (messageData ?? []) as Message[];

  const counterpart =
    profile.role === "shop"
      ? conversation.extras_profiles?.profiles?.display_name ?? "Barista"
      : conversation.coffee_shops?.name ?? "Coffee shop";

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.75rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3.5 border-b border-border py-4">
        <Link
          href="/messages"
          aria-label="All conversations"
          className="pressable flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4.5" />
        </Link>
        <Avatar name={counterpart} />
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{counterpart}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {conversation.announcements?.title ?? "Gig conversation"}
          </p>
        </div>
      </div>

      <MessageThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
