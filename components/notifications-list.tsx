"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/database.types";
import { useDict, useLocaleTag } from "@/components/i18n-provider";

export function MarkAllReadButton() {
  const d = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
    >
      <CheckCheck className="size-4" /> {d.notifications.markAllShort}
    </Button>
  );
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const loc = useLocaleTag();
  const router = useRouter();

  function markRead(notification: Notification) {
    if (notification.read_at) return;
    void markNotificationRead(notification.id).then(() => router.refresh());
  }

  return (
    <ul className="stagger flex flex-col gap-2">
      {notifications.map((notification) => {
        const unread = !notification.read_at;
        const content = (
          <>
            <div className="flex items-start justify-between gap-4">
              <p
                className={cn(
                  "flex min-w-0 items-center gap-2 text-sm",
                  unread ? "font-medium" : "text-muted-foreground",
                )}
              >
                {unread ? <span className="size-1.5 shrink-0 rounded-full bg-accent" /> : null}
                <span className="truncate">{notification.title}</span>
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelative(notification.created_at, loc)}
              </span>
            </div>
            {notification.body ? (
              <p className="mt-1 truncate text-[13px] text-muted-foreground">
                {notification.body}
              </p>
            ) : null}
          </>
        );

        return (
          <li key={notification.id}>
            {notification.href ? (
              <Link
                href={notification.href}
                onClick={() => markRead(notification)}
                className={cn(
                  "block rounded-lg border border-border p-4 transition-colors duration-150 hover:bg-muted",
                  unread ? "bg-surface" : "bg-surface/50",
                )}
              >
                {content}
              </Link>
            ) : (
              <div
                className={cn(
                  "rounded-lg border border-border p-4",
                  unread ? "bg-surface" : "bg-surface/50",
                )}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
