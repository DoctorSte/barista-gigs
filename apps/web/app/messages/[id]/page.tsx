import { notFound } from "next/navigation";
import { MessageThread } from "@/components/message-thread";
import { PageShell } from "@/components/page-shell";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, announcements(title)")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <PageShell
      title={relationOne(conversation.announcements)?.title ?? "Conversation"}
      description="In-app messaging for this gig."
    >
      <MessageThread
        conversationId={id}
        messages={messages ?? []}
        currentUserId={profile.id}
      />
    </PageShell>
  );
}
