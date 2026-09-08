import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NotificationSettingsForm } from "@/components/notification-settings-form";
import type { NotificationPrefs } from "@/lib/database.types";
import { getDict } from "@/lib/i18n";

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

  const d = await getDict();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{d.settings.notifTitle}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {d.settings.notifSub}
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
