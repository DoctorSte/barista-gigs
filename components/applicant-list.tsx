"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Banknote, Check, Inbox, MessageSquare, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";
import { decideInterest } from "@/app/actions/gigs";
import { toggleRecommendation } from "@/app/actions/recommendations";
import type { Interest, RateCard } from "@/lib/database.types";
import { formatMoney, formatRelative } from "@/lib/format";
import { skillLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge, InterestStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export type ApplicantRow = Interest & {
  extras_profiles: {
    id: string;
    bio: string | null;
    years_experience: number | null;
    hourly_rate_cents: number | null;
    currency: string;
    rates: RateCard[];
    signature_drink: string | null;
    instagram_handle: string | null;
    skills: string[];
    profiles: { display_name: string; avatar_url: string | null } | null;
  } | null;
};

export type RecommendationSummary = { shopNames: string[]; mine: boolean };

export function ApplicantList({
  applicants,
  conversationByExtra,
  recommendationsByExtra,
  workedByExtra,
  paymentByExtra,
}: {
  applicants: ApplicantRow[];
  conversationByExtra: Record<string, string>;
  recommendationsByExtra: Record<string, RecommendationSummary>;
  workedByExtra: Record<string, number>;
  paymentByExtra: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (applicants.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No applications yet"
        description="Baristas in your city will see this gig while it's open."
      />
    );
  }

  function decide(interestId: string, decision: "accepted" | "declined") {
    startTransition(async () => {
      const result = await decideInterest(interestId, decision);
      if (result.ok) {
        toast.success(decision === "accepted" ? "Application accepted" : "Application declined");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function recommend(extraId: string) {
    startTransition(async () => {
      const result = await toggleRecommendation(extraId);
      if (result.ok) {
        toast.success(
          result.data?.recommended ? "Recommendation added" : "Recommendation removed",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="stagger flex flex-col gap-3">
      {applicants.map((applicant) => {
        const extra = applicant.extras_profiles;
        const name = extra?.profiles?.display_name ?? "Barista";
        const conversationId = extra ? conversationByExtra[extra.id] : undefined;
        const recs = extra ? recommendationsByExtra[extra.id] : undefined;
        const worked = extra ? (workedByExtra[extra.id] ?? 0) : 0;
        const payment = extra ? paymentByExtra[extra.id] : undefined;
        return (
          <li key={applicant.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start gap-3.5">
              <Avatar name={name} src={extra?.profiles?.avatar_url} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{name}</p>
                  <InterestStatusBadge status={applicant.status} />
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {[
                    extra?.years_experience != null ? `${extra.years_experience} yrs experience` : null,
                    extra?.hourly_rate_cents != null
                      ? `${formatMoney(extra.hourly_rate_cents, extra.currency)}/hr`
                      : null,
                    `applied ${formatRelative(applicant.created_at)}`,
                    worked > 0 ? `${worked} ${worked === 1 ? "shift" : "shifts"} at your shop` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {extra && (extra.rates.length > 0 || extra.signature_drink || extra.instagram_handle) ? (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
                    {extra.rates.map((rate) => (
                      <span key={rate.label}>
                        {rate.label} {formatMoney(rate.cents, extra.currency)}/hr
                      </span>
                    ))}
                    {extra.signature_drink ? <span>Signature: {extra.signature_drink}</span> : null}
                    {extra.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${extra.instagram_handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <AtSign className="size-3.5" />
                        {extra.instagram_handle}
                      </a>
                    ) : null}
                  </p>
                ) : null}
                {recs && recs.shopNames.length > 0 ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                    <ThumbsUp className="size-3.5" />
                    Recommended by {recs.shopNames.join(", ")}
                  </p>
                ) : null}
                {extra && extra.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {extra.skills.map((skill) => (
                      <Badge key={skill}>{skillLabel(skill)}</Badge>
                    ))}
                  </div>
                ) : null}
                {applicant.message ? (
                  <p className="mt-3 rounded-md bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed">
                    {applicant.message}
                  </p>
                ) : null}
                {applicant.status === "accepted" && payment ? (
                  <details className="mt-3">
                    <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
                      <Banknote className="size-3.5" /> Payment details
                    </summary>
                    <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-muted/60 px-3.5 py-2.5 font-mono text-sm">
                      {payment}
                    </p>
                  </details>
                ) : null}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  {applicant.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        loading={pending}
                        onClick={() => decide(applicant.id, "accepted")}
                      >
                        <Check className="size-4" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() => decide(applicant.id, "declined")}
                      >
                        <X className="size-4" /> Decline
                      </Button>
                    </>
                  ) : null}
                  {applicant.status === "accepted" && conversationId ? (
                    <Link
                      href={`/messages/${conversationId}`}
                      className="pressable inline-flex items-center gap-1.5 rounded-sm bg-success-soft px-3 py-1.5 text-[13px] font-medium text-success"
                    >
                      <MessageSquare className="size-4" /> Open conversation
                    </Link>
                  ) : null}
                  {applicant.status === "accepted" && extra ? (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={pending}
                      onClick={() => recommend(extra.id)}
                    >
                      <ThumbsUp className="size-4" />
                      {recs?.mine ? "Recommended" : "Recommend"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
