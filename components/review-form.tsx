"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { leaveReview } from "@/app/actions/trust";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Inline star + comment form; collapses to a button until opened. */
export function ReviewForm({ interestId, subject }: { interestId: string; subject: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Star className="size-4" /> Review {subject}
      </Button>
    );
  }

  function submit() {
    if (rating === 0) {
      toast.error("Pick a rating first");
      return;
    }
    startTransition(async () => {
      const result = await leaveReview(interestId, rating, comment);
      if (result.ok) {
        toast.success("Review posted");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="w-full rounded-md border border-border bg-muted/40 p-3.5">
      <div className="flex items-center gap-1" role="radiogroup" aria-label={`Rate ${subject}`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(value)}
            className="pressable rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                "size-6 transition-colors duration-100",
                value <= (hovered || rating)
                  ? "fill-warning text-warning"
                  : "text-border-strong",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={500}
        rows={2}
        placeholder={`How was working with ${subject}? (optional)`}
        className="mt-2.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" loading={pending} onClick={submit}>
          Post review
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** Read-only star strip, e.g. "★★★★☆ 4.2 (6)". */
export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              "size-3.5",
              value <= Math.round(rating) ? "fill-warning text-warning" : "text-border-strong",
            )}
          />
        ))}
      </span>
      <span className="text-[13px] font-medium">{rating.toFixed(1)}</span>
      {count != null ? (
        <span className="text-[13px] text-muted-foreground">({count})</span>
      ) : null}
    </span>
  );
}
