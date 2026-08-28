"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { switchLocation } from "@/app/actions/locations";
import { cn } from "@/lib/utils";

export function LocationSwitcher({
  locations,
  activeId,
  canAdd,
  upgradeHint,
}: {
  locations: { id: string; name: string }[];
  activeId: string;
  canAdd: boolean;
  /** Shown instead of the add button when the plan's location cap is reached. */
  upgradeHint: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function activate(shopId: string) {
    if (shopId === activeId) return;
    startTransition(async () => {
      const result = await switchLocation(shopId);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <MapPin className="size-4 text-muted-foreground" />
      {locations.map((location) => (
        <button
          key={location.id}
          type="button"
          disabled={pending}
          aria-pressed={location.id === activeId}
          onClick={() => activate(location.id)}
          className={cn(
            "pressable rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
            location.id === activeId
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          {location.name}
        </button>
      ))}
      {canAdd ? (
        <Link
          href="/cafe/locations/new"
          className="pressable inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" /> Add location
        </Link>
      ) : upgradeHint ? (
        <Link
          href="/settings/billing"
          className="text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Upgrade to Group for up to 3 locations
        </Link>
      ) : null}
    </div>
  );
}
