"use client";

import { useActionState, useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { expressInterest } from "@/app/actions/interests";
import { SubmitButton } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";

export function InterestForm({ announcementId }: { announcementId: string }) {
  const [state, action] = useActionState(expressInterest, null);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (state?.ok) toast.success("Application sent");
  }, [state]);

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold">Apply for this gig</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        One click — the shop sees your full profile, rates and portfolio.
      </p>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="announcementId" value={announcementId} />
        {showMessage ? (
          <Field label="Message (optional)">
            {(id) => (
              <Textarea
                id={id}
                name="message"
                maxLength={600}
                autoFocus
                placeholder="Anything the shop should know — e.g. I've pulled shots on a Linea for three years…"
              />
            )}
          </Field>
        ) : null}
        <FormError message={state && !state.ok ? state.error : undefined} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>Apply with your profile</SubmitButton>
          {!showMessage ? (
            <button
              type="button"
              onClick={() => setShowMessage(true)}
              className="pressable inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              <MessageSquarePlus className="size-4" /> Add a message
            </button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
