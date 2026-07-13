"use client";

import { useState } from "react";
import { sendMessageAction } from "@/app/actions/profile";

export function MessageThread({
  conversationId,
  messages,
  currentUserId,
}: {
  conversationId: string;
  messages: Array<{
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>;
  currentUserId: string;
}) {
  const [body, setBody] = useState("");

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                mine
                  ? "ml-auto bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-900"
              }`}
            >
              {message.body}
            </div>
          );
        })}
      </div>
      <form
        action={async (formData) => {
          await sendMessageAction(formData);
          setBody("");
        }}
        className="flex gap-2 border-t border-stone-200 p-4"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <input
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-full border border-stone-300 px-4 py-2"
        />
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
          Send
        </button>
      </form>
    </div>
  );
}
