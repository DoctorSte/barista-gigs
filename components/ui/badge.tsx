"use client";

import { cn } from "@/lib/utils";
import { useDict } from "@/components/i18n-provider";
import type { AnnouncementStatus, InterestStatus } from "@/lib/database.types";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-accent-soft text-accent dark:text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

const GIG_STATUS: Record<AnnouncementStatus, { tone: Tone }> = {
  draft: { tone: "neutral" },
  open: { tone: "success" },
  filled: { tone: "accent" },
  closed: { tone: "neutral" },
};

export function GigStatusBadge({ status }: { status: AnnouncementStatus }) {
  const d = useDict();
  const { tone } = GIG_STATUS[status];
  return <Badge tone={tone}>{d.status[status]}</Badge>;
}

const INTEREST_STATUS: Record<InterestStatus, { tone: Tone }> = {
  pending: { tone: "warning" },
  accepted: { tone: "success" },
  declined: { tone: "neutral" },
};

export function InterestStatusBadge({ status }: { status: InterestStatus }) {
  const d = useDict();
  const { tone } = INTEREST_STATUS[status];
  return <Badge tone={tone}>{d.status[status]}</Badge>;
}
