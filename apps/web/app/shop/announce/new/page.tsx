import { PageShell } from "@/components/page-shell";
import { AnnouncementForm } from "@/components/announcement-form";
import { getCurrentProfile } from "@/lib/auth";

export default async function NewAnnouncementPage() {
  const profile = await getCurrentProfile();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(16, 0, 0, 0);

  return (
    <PageShell
      title="Post announcement"
      description="Publish a gig and see recommended baristas for your dates."
    >
      <AnnouncementForm
        cityId={profile?.city_id ?? ""}
        defaultStartsAt={tomorrow.toISOString()}
        defaultEndsAt={end.toISOString()}
      />
    </PageShell>
  );
}
