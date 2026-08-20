import { cn } from "@/lib/utils";
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

const GIG_STATUS: Record<AnnouncementStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  open: { label: "Open", tone: "success" },
  filled: { label: "Filled", tone: "accent" },
  closed: { label: "Closed", tone: "neutral" },
};

export function GigStatusBadge({ status }: { status: AnnouncementStatus }) {
  const { label, tone } = GIG_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const INTEREST_STATUS: Record<InterestStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
};

export function InterestStatusBadge({ status }: { status: InterestStatus }) {
  const { label, tone } = INTEREST_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
