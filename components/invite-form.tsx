"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { inviteToGig } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";

export function InviteForm({
  extraId,
  gigs,
  alreadyAppliedGigIds,
}: {
  extraId: string;
  gigs: { id: string; title: string }[];
  alreadyAppliedGigIds: string[];
}) {
  const applied = new Set(alreadyAppliedGigIds);
  const [gigId, setGigId] = useState(() => gigs.find((gig) => !applied.has(gig.id))?.id ?? "");
  const [pending, startTransition] = useTransition();

  function send() {
    if (!gigId) return;
    startTransition(async () => {
      const result = await inviteToGig(extraId, gigId);
      if (result.ok) {
        toast.success("Invite sent");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Gig">
        {(id) => (
          <Select id={id} value={gigId} onChange={(event) => setGigId(event.target.value)}>
            <option value="" disabled>
              Select a gig
            </option>
            {gigs.map((gig) => (
              <option key={gig.id} value={gig.id} disabled={applied.has(gig.id)}>
                {gig.title}
                {applied.has(gig.id) ? " — already applied" : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Button onClick={send} loading={pending} disabled={!gigId} className="self-start">
        <Send className="size-4" /> Send invite
      </Button>
    </div>
  );
}
