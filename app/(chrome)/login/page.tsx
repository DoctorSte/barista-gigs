import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const d = await getDict();

  return (
    <AuthShell
      title={d.auth.welcomeBack}
      subtitle={d.auth.loginSub}
      footer={
        <>
          {d.auth.newHere}{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            {d.auth.createAnAccount}
          </Link>
        </>
      }
    >
      <LoginForm
        next={params.next}
        initialError={params.error === "auth" ? d.auth.linkExpired : undefined}
      />
    </AuthShell>
  );
}
