import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "shop" || params.role === "extra" ? params.role : undefined;

  return (
    <AuthShell
      title="Join Barista Gigs"
      subtitle="Free for baristas. Shops subscribe when they're ready to post."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm initialRole={role} />
    </AuthShell>
  );
}
