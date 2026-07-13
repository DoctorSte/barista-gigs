import { PageShell } from "@/components/page-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <PageShell title="Log in" description="Access gigs, messages, and your profile.">
      <LoginForm next={params.next} />
    </PageShell>
  );
}
