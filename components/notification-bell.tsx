"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/database.types";

// Poll while the tab is visible; realtime isn't guaranteed to be enabled.
const POLL_INTERVAL_MS = 30_000;

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  // Notifications that arrived via polling and aren't in the server props yet.
  const [fresh, setFresh] = useState<Notification[]>([]);
  const latestRef = useRef(
    notifications[0]?.created_at ?? new Date(0).toISOString(),
  );

  useEffect(() => {
    const newest = notifications[0]?.created_at;
    if (newest && newest > latestRef.current) latestRef.current = newest;

    const supabase = createClient();

    async function fetchNew() {
      if (document.hidden) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .gt("created_at", latestRef.current)
        .order("created_at", { ascending: true });
      const incoming = (data ?? []) as Notification[];
      if (incoming.length === 0) return;

      latestRef.current = incoming[incoming.length - 1]!.created_at;
      setFresh((prev) => [...incoming.reverse(), ...prev]);

      if (incoming.length > 3) {
        toast(`${incoming.length} new notifications`, {
          action: { label: "View", onClick: () => router.push("/notifications") },
        });
      } else {
        for (const notification of incoming) {
          toast(notification.title, {
            description: notification.body ?? undefined,
            action: {
              label: "View",
              onClick: () => router.push(notification.href ?? "/notifications"),
            },
          });
        }
      }
      router.refresh();
    }

    const interval = setInterval(fetchNew, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", fetchNew);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchNew);
    };
  }, [notifications, router]);

  const freshNotInProps = fresh.filter(
    (f) => !notifications.some((n) => n.id === f.id),
  );
  const items = [...freshNotInProps, ...notifications].slice(0, 8);
  const totalUnread = unreadCount + freshNotInProps.filter((n) => !n.read_at).length;

  function openNotification(notification: Notification) {
    if (!notification.read_at) {
      void markNotificationRead(notification.id).then(() => router.refresh());
    }
    router.push(notification.href ?? "/notifications");
  }

  return (
    <Menu
      className="w-80"
      trigger={() => (
        <span
          aria-label={
            totalUnread > 0 ? `Notifications (${totalUnread} unread)` : "Notifications"
          }
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          {totalUnread > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          ) : null}
        </span>
      )}
    >
      <MenuLabel>Notifications</MenuLabel>
      {items.length === 0 ? (
        <MenuLabel>Nothing yet</MenuLabel>
      ) : (
        items.map((notification) => (
          <MenuItem key={notification.id} onSelect={() => openNotification(notification)}>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  !notification.read_at && "font-medium",
                )}
              >
                {!notification.read_at ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                ) : null}
                <span className="truncate">{notification.title}</span>
              </span>
              {notification.body ? (
                <span className="truncate text-[13px] text-muted-foreground">
                  {notification.body}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {formatRelative(notification.created_at)}
              </span>
            </span>
          </MenuItem>
        ))
      )}
      <MenuSeparator />
      <MenuItem onSelect={() => router.push("/notifications")}>
        <Bell className="size-4 text-muted-foreground" /> View all
      </MenuItem>
      {totalUnread > 0 ? (
        <MenuItem
          onSelect={() => {
            void markAllNotificationsRead().then(() => {
              setFresh([]);
              router.refresh();
            });
          }}
        >
          <CheckCheck className="size-4 text-muted-foreground" /> Mark all read
        </MenuItem>
      ) : null}
    </Menu>
  );
}
