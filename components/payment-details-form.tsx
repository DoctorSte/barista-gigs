"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePaymentDetails } from "@/app/actions/profile";
import { SubmitButton } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { Section } from "@/components/ui/section";
import { useDict } from "@/components/i18n-provider";

export function PaymentDetailsForm({ details }: { details: string }) {
  const d = useDict();
  const [state, action] = useActionState(updatePaymentDetails, null);
  const error = state && !state.ok ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success(d.uploads.paymentSaved);
  }, [state, d]);

  return (
    <Section title={d.profile.paymentDetails} hint={d.profile.paymentDetailsSub}>
      <form action={action} className="flex flex-col gap-5">
        <Field label={d.uploads.detailsLabel} error={error?.field === "details" ? error.error : undefined}>
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
        <SubmitButton className="self-start">{d.profile.savePaymentDetails}</SubmitButton>
      </form>
    </Section>
  );
}
