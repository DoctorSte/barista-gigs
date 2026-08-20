"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setGigStatus } from "@/app/actions/gigs";
import type { AnnouncementStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

const NEXT_ACTIONS: Record<AnnouncementStatus, { label: string; to: AnnouncementStatus }[]> = {
  draft: [{ label: "Publish", to: "open" }],
  open: [
    { label: "Mark filled", to: "filled" },
    { label: "Close", to: "closed" },
  ],
  filled: [
    { label: "Reopen", to: "open" },
    { label: "Close", to: "closed" },
  ],
  closed: [{ label: "Reopen", to: "open" }],
};

export function GigStatusControl({
  gigId,
  status,
}: {
  gigId: string;
  status: AnnouncementStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {NEXT_ACTIONS[status].map((action) => (
        <Button
          key={action.to}
          variant="outline"
          size="sm"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await setGigStatus(gigId, action.to);
              if (result.ok) {
                toast.success(`Gig ${action.to === "open" ? "opened" : action.to}`);
                router.refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
