"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    supabaseRef.current ??= createClient();
    return supabaseRef.current;
  }

  const mergeMessages = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length > 0 ? [...prev, ...fresh] : prev;
    });
  }, []);

  // Poll while the tab is visible; realtime isn't guaranteed to be enabled.
  useEffect(() => {
    let latest = messages[messages.length - 1]?.created_at ?? new Date(0).toISOString();

    async function fetchNew() {
      if (document.hidden) return;
      const { data } = await getSupabase()
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .gt("created_at", latest)
        .order("created_at");
      if (data && data.length > 0) {
        latest = data[data.length - 1]!.created_at;
        mergeMessages(data as Message[]);
      }
    }

    const interval = setInterval(fetchNew, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", fetchNew);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, mergeMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await getSupabase()
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select("*")
      .single();
    setSending(false);
    if (error || !data) {
      toast.error("Message didn't send. Try again.");
      return;
    }
    setDraft("");
    mergeMessages([data as Message]);
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Say hello — sort out timing, pay, and where to find the keys.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((message, index) => {
              const own = message.sender_id === currentUserId;
              const prev = messages[index - 1];
              const showTimestamp =
                !prev ||
                new Date(message.created_at).getTime() - new Date(prev.created_at).getTime() >
                  20 * 60 * 1000;
              return (
                <li key={message.id} className="flex flex-col">
                  {showTimestamp ? (
                    <p className="my-3 text-center text-xs text-muted-foreground">
                      {formatDateTime(message.created_at)}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "bubble-in max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                      own
                        ? "self-end rounded-br-md bg-primary text-primary-foreground"
                        : "self-start rounded-bl-md border border-border bg-surface",
                    )}
                  >
                    {message.body}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2.5 border-t border-border py-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-36 min-h-11 flex-1 resize-none rounded-md border border-border bg-surface px-3.5 py-2.5 text-[15px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/70 focus:border-border-strong focus:ring-2 focus:ring-ring/25"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="pressable flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground outline-none transition-opacity duration-150 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45"
        >
          {sending ? <Spinner className="size-4.5" /> : <Send className="size-4.5" />}
        </button>
      </form>
    </>
  );
}
