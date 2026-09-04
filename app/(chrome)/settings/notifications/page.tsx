import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NotificationSettingsForm } from "@/components/notification-settings-form";
import type { NotificationPrefs } from "@/lib/database.types";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationSettingsPage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();
  const prefs = (data as NotificationPrefs | null) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Choose which emails you receive. In-app notifications always show up under the bell.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <NotificationSettingsForm
          role={profile.role}
          initial={{
            email_applications: prefs?.email_applications ?? true,
            email_messages: prefs?.email_messages ?? true,
            email_opportunities: prefs?.email_opportunities ?? true,
            email_team: prefs?.email_team ?? true,
            email_referrals: prefs?.email_referrals ?? true,
            email_digest: prefs?.email_digest ?? true,
          }}
        />
      </Card>
    </div>
  );
}
