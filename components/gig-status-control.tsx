"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setGigStatus } from "@/app/actions/gigs";
import type { AnnouncementStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/i18n-provider";

const NEXT_ACTIONS: Record<AnnouncementStatus, { key: "publish" | "markFilled" | "close" | "reopen"; to: AnnouncementStatus }[]> = {
  draft: [{ key: "publish", to: "open" }],
  open: [
    { key: "markFilled", to: "filled" },
    { key: "close", to: "closed" },
  ],
  filled: [
    { key: "reopen", to: "open" },
    { key: "close", to: "closed" },
  ],
  closed: [{ key: "reopen", to: "open" }],
};

export function GigStatusControl({
  gigId,
  status,
}: {
  gigId: string;
  status: AnnouncementStatus;
}) {
  const router = useRouter();
  const d = useDict();
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
                toast.success(d.cafe.statusUpdated);
                router.refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          {d.cafe[action.key]}
        </Button>
      ))}
    </div>
  );
}
