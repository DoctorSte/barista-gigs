"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePaymentDetails } from "@/app/actions/profile";
import { SubmitButton } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Card } from "@/components/ui/card";

export function PaymentDetailsForm({ details }: { details: string }) {
  const [state, action] = useActionState(updatePaymentDetails, null);
  const error = state && !state.ok ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success("Payment details saved");
  }, [state]);

  return (
    <Card>
      <form action={action} className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Payment details</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How shops should pay you — IBAN, payment link, invoicing notes. Only shops that
            accepted you for a gig can see this.
          </p>
        </div>

        <Field label="Details" error={error?.field === "details" ? error.error : undefined}>
          {(id) => (
            <Textarea
              id={id}
              name="details"
              defaultValue={details}
              maxLength={600}
              className="min-h-24"
              placeholder={"IBAN: FR76 …\nAccount name: …\nOr PayPal: …"}
            />
          )}
        </Field>

        <FormError message={error && !error.field ? error.error : undefined} />
        <SubmitButton className="self-start">Save payment details</SubmitButton>
      </form>
    </Card>
  );
}
