import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton, NotificationsList } from "@/components/notifications-list";
import type { Notification } from "@/lib/database.types";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as Notification[];
  const hasUnread = notifications.some((notification) => !notification.read_at);

  const d = await getDict();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{d.notifications.title}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Applications, decisions and updates — all in one place.
          </p>
        </div>
        {hasUnread ? <MarkAllReadButton /> : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={d.notifications.empty}
          description={d.notifications.emptySub2}
        />
      ) : (
        <NotificationsList notifications={notifications} />
      )}
    </div>
  );
}
