"use client";

import { useActionState, useState } from "react";
import { Coffee, Store } from "lucide-react";
import { MailCheck } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import { SubmitButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "extra" as const,
    icon: Coffee,
    title: "I'm a barista",
    caption: "Find shifts near you",
  },
  {
    value: "shop" as const,
    icon: Store,
    title: "I run a shop",
    caption: "Hire trusted extras",
  },
];

export function SignupForm({ initialRole }: { initialRole?: "shop" | "extra" }) {
  const [role, setRole] = useState<"shop" | "extra">(initialRole ?? "extra");
  const [state, action] = useActionState(signUp, null);

  if (state?.ok && state.data?.needsConfirmation) {
    return (
      <div className="bubble-in flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-6" strokeWidth={1.75} />
        </span>
        <p className="font-medium">Check your inbox</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          We sent you a confirmation link. Click it to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Account type">
        {ROLES.map((option) => {
          const active = role === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(option.value)}
              className={cn(
                "pressable flex flex-col items-start gap-1.5 rounded-md border p-3.5 text-left outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                active
                  ? "border-accent bg-accent-soft/60"
                  : "border-border hover:border-border-strong",
              )}
            >
              <option.icon
                className={cn("size-5", active ? "text-accent" : "text-muted-foreground")}
                strokeWidth={1.75}
              />
              <span className="text-sm font-medium">{option.title}</span>
              <span className="text-xs text-muted-foreground">{option.caption}</span>
            </button>
          );
        })}
      </div>
      <Field label={role === "shop" ? "Your name" : "Full name"}>
        {(id) => <Input id={id} name="displayName" autoComplete="name" required />}
      </Field>
      <Field label="Email">
        {(id) => <Input id={id} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Field label="Password" hint="At least 8 characters">
        {(id) => (
          <Input id={id} name="password" type="password" autoComplete="new-password" required minLength={8} />
        )}
      </Field>
      <FormError message={state && !state.ok ? state.error : undefined} />
      <SubmitButton size="lg" className="w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
