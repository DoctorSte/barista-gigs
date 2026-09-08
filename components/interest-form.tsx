"use client";

import { useActionState, useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { expressInterest } from "@/app/actions/interests";
import { SubmitButton } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";
import { useDict } from "@/components/i18n-provider";

export function InterestForm({ announcementId }: { announcementId: string }) {
  const d = useDict();
  const [state, action] = useActionState(expressInterest, null);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (state?.ok) toast.success(d.gigs.applicationSent);
  }, [state, d]);

  return (
    <Card>
      <h2 className="font-display text-lg font-semibold">{d.gigs.applyForGig}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {d.gigs.applyOneClick}
      </p>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="announcementId" value={announcementId} />
        {showMessage ? (
          <Field label={d.gigs.messageOptional}>
            {(id) => (
              <Textarea
                id={id}
                name="message"
                maxLength={600}
                autoFocus
                placeholder={d.gigs.messagePlaceholder}
              />
            )}
          </Field>
        ) : null}
        <FormError message={state && !state.ok ? state.error : undefined} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>{d.gigs.applyWithProfile}</SubmitButton>
          {!showMessage ? (
            <button
              type="button"
              onClick={() => setShowMessage(true)}
              className="pressable inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              <MessageSquarePlus className="size-4" /> {d.gigs.addMessage}
            </button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
