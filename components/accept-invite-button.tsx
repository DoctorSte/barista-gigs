"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { acceptInvite } from "@/app/actions/team";

export function AcceptInviteButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      // On success the action redirects to the dashboard; only errors return.
      const result = await acceptInvite(token);
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={accept}
      className="pressable inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "Joining…" : "Join the team"}
    </button>
  );
}
