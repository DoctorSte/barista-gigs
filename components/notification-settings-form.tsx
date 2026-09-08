"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setNotificationPref } from "@/app/actions/notification-settings";
import { Switch } from "@/components/ui/switch";
import type { EmailPrefKey } from "@/lib/notification-prefs";
import { useDict } from "@/components/i18n-provider";
import type { Dict } from "@/lib/i18n/en";

type Row = { key: EmailPrefKey; label: string; description: string };

function rowsForRole(role: "shop" | "extra", d: Dict): { instant: Row[]; digest: Row[] } {
  const t = d.settings;
  if (role === "shop") {
    return {
      instant: [
        { key: "email_applications", label: t.newApplicants, description: t.newApplicantsSub },
        { key: "email_team", label: t.teamActivity, description: t.teamActivitySub },
      ],
      digest: [
        { key: "email_messages", label: t.messagesToggle, description: t.messagesSubShop },
        { key: "email_referrals", label: t.referralRewards, description: t.referralRewardsSub },
      ],
    };
  }
  return {
    instant: [
      {
        key: "email_applications",
        label: t.applicationUpdates,
        description: t.applicationUpdatesSub,
      },
      { key: "email_opportunities", label: t.invitesSos, description: t.invitesSosSub },
    ],
    digest: [
      { key: "email_messages", label: t.messagesToggle, description: t.messagesSubExtra },
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
  const d = useDict();
  const [prefs, setPrefs] = useState(initial);
  const [, startTransition] = useTransition();
  const { instant, digest } = rowsForRole(role, d);

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
        {d.settings.emailedRightAway}
      </h2>
      <div className="mt-1 divide-y divide-border">{instant.map(renderRow)}</div>

      <h2 className="mt-8 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
        {d.settings.dailyDigest}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {d.settings.digestIntro}
      </p>
      <div className="mt-2 divide-y divide-border">
        {digest.map(renderRow)}
        <div className="flex items-center justify-between gap-6 py-3.5">
          <div>
            <p className="text-[15px] font-medium">{d.settings.digestToggle}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {d.settings.digestToggleSub}
            </p>
          </div>
          <Switch
            checked={prefs.email_digest}
            onCheckedChange={(value) => toggle("email_digest", value)}
            aria-label={d.settings.digestToggle}
          />
        </div>
      </div>
    </div>
  );
}
