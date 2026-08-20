"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/form-error";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState(logIn, null);
  const error = state && !state.ok ? state.error : initialError;

  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email">
        {(id) => (
          <Input id={id} name="email" type="email" autoComplete="email" required autoFocus />
        )}
      </Field>
      <Field label="Password">
        {(id) => (
          <Input id={id} name="password" type="password" autoComplete="current-password" required />
        )}
      </Field>
      <FormError message={error} />
      <SubmitButton size="lg" className="w-full">
        Log in
      </SubmitButton>
      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        Forgot your password?
      </Link>
    </form>
  );
}
