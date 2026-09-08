import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getDict } from "@/lib/i18n";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const d = await getDict();
  return (
    <AuthShell title={d.auth.chooseNewPassword} subtitle={d.auth.makeItGood}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
