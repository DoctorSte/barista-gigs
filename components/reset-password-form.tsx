"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/form-error";

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="New password" hint="At least 8 characters">
        {(id) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            autoFocus
          />
        )}
      </Field>
      <Field label="Confirm password">
        {(id) => (
          <Input id={id} name="confirm" type="password" autoComplete="new-password" required />
        )}
      </Field>
      <FormError message={state && !state.ok ? state.error : undefined} />
      <SubmitButton size="lg" className="w-full">
        Update password
      </SubmitButton>
    </form>
  );
}
