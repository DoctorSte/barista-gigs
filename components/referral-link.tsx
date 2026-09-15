"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { sendReferralInvite } from "@/app/actions/referrals";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/i18n-provider";
import type { ActionResult } from "@/lib/validation";

/**
 * The shareable /r/<code> link. Baristas also get an invite form — pass the
 * addresses they've already invited to show it; cafés get the link alone.
 */
export function ReferralLink({ code, invited }: { code: string; invited?: string[] }) {
  const d = useDict();
  const router = useRouter();
  const path = `/r/${code}`;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, sending] = useActionState<ActionResult | null, FormData>(
    sendReferralInvite,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(d.profile.inviteSent);
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router, d]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(d.common.copied);
    } catch {
      toast.error(d.common.copyFailed);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-full border border-border bg-muted px-3.5 py-1.5 font-mono text-[13px] text-muted-foreground">
          {path}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
          <Copy className="size-3.5" />
          {d.common.copy}
        </Button>
      </div>

      {invited ? (
      <div>
        <p className="text-[13px] text-muted-foreground">{d.profile.inviteByEmail}</p>
        <form ref={formRef} action={formAction} className="mt-2 flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder={d.profile.invitePlaceholder}
            aria-label={d.profile.inviteByEmail}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={sending}
            className="pressable inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {sending ? d.common.loading : d.profile.invite}
          </button>
        </form>
        {invited.length > 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            {d.profile.inviteSentTo(invited.length)}{" "}
            <span className="text-foreground">{invited.join(", ")}</span>
          </p>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
