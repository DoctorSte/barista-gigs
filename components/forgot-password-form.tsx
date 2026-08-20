"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/form-error";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, null);

  if (state?.ok) {
    return (
      <div className="bubble-in flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-6" strokeWidth={1.75} />
        </span>
        <p className="font-medium">Check your inbox</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email">
        {(id) => (
          <Input id={id} name="email" type="email" autoComplete="email" required autoFocus />
        )}
      </Field>
      <FormError message={state && !state.ok ? state.error : undefined} />
      <SubmitButton size="lg" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
