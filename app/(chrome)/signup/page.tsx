import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getDict } from "@/lib/i18n";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const d = await getDict();
  const role = params.role === "shop" || params.role === "extra" ? params.role : undefined;

  return (
    <AuthShell
      title={d.auth.joinTitle}
      subtitle={d.auth.joinSub}
      footer={
        <>
          {d.auth.alreadyHave}{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            {d.common.logIn}
          </Link>
        </>
      }
    >
      <SignupForm initialRole={role} />
    </AuthShell>
  );
}
