"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setNotificationPref } from "@/app/actions/notification-settings";
import { Switch } from "@/components/ui/switch";
import type { EmailPrefKey } from "@/lib/notification-prefs";

type Row = { key: EmailPrefKey; label: string; description: string };

function rowsForRole(role: "shop" | "extra"): { instant: Row[]; digest: Row[] } {
  if (role === "shop") {
    return {
      instant: [
        {
          key: "email_applications",
          label: "New applicants",
          description: "A barista applies to one of your gigs.",
        },
        {
          key: "email_team",
          label: "Team activity",
          description: "Someone joins your café team, or you're invited to one.",
        },
      ],
      digest: [
        {
          key: "email_messages",
          label: "Messages",
          description: "Unread messages from baristas.",
        },
        {
          key: "email_referrals",
          label: "Referral rewards",
          description: "A café you referred earns you a free month.",
        },
      ],
    };
  }
  return {
    instant: [
      {
        key: "email_applications",
        label: "Application updates",
        description: "Accepts arrive right away; declines are bundled into the digest.",
      },
      {
        key: "email_opportunities",
        label: "Invites & SOS gigs",
        description: "A café invites you directly, or posts an urgent shift.",
      },
    ],
    digest: [
      {
        key: "email_messages",
        label: "Messages",
        description: "Unread messages from cafés.",
      },
    ],
  };
}

export function NotificationSettingsForm({
  role,
  initial,
}: {
  role: "shop" | "extra";
  initial: Record<EmailPrefKey, boolean>;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [, startTransition] = useTransition();
  const { instant, digest } = rowsForRole(role);

  function toggle(key: EmailPrefKey, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      const result = await setNotificationPref(key, value);
      if (!result.ok) {
        setPrefs((prev) => ({ ...prev, [key]: !value }));
        toast.error(result.error);
      }
    });
  }

  function renderRow(row: Row) {
    return (
      <div key={row.key} className="flex items-center justify-between gap-6 py-3.5">
        <div>
          <p className="text-[15px] font-medium">{row.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{row.description}</p>
        </div>
        <Switch
          checked={prefs[row.key]}
          onCheckedChange={(value) => toggle(row.key, value)}
          aria-label={row.label}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
        Emailed right away
      </h2>
      <div className="mt-1 divide-y divide-border">{instant.map(renderRow)}</div>

      <h2 className="mt-8 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
        Daily digest
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        One morning email bundling everything unread — nothing unread, no email.
      </p>
      <div className="mt-2 divide-y divide-border">
        {digest.map(renderRow)}
        <div className="flex items-center justify-between gap-6 py-3.5">
          <div>
            <p className="text-[15px] font-medium">Daily digest</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Turn this off to stop digest emails entirely.
            </p>
          </div>
          <Switch
            checked={prefs.email_digest}
            onCheckedChange={(value) => toggle("email_digest", value)}
            aria-label="Daily digest"
          />
        </div>
      </div>
    </div>
  );
}
