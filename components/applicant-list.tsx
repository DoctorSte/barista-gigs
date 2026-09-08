"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Banknote, Check, CheckCheck, FileText, Inbox, MessageSquare, RotateCcw, ThumbsUp, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { decideInterest } from "@/app/actions/gigs";
import { toggleRecommendation } from "@/app/actions/recommendations";
import { setWorkStatus } from "@/app/actions/trust";
import { ReviewForm } from "@/components/review-form";
import type { Interest, RateCard } from "@/lib/database.types";
import { formatMoney, formatRelative } from "@/lib/format";
import { skillLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge, InterestStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDict, useLocaleTag } from "@/components/i18n-provider";

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
    cv_path: string | null;
    cv_filename: string | null;
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
  cvByExtra,
  gigEnded = false,
  reviewedInterestIds = [],
}: {
  applicants: ApplicantRow[];
  conversationByExtra: Record<string, string>;
  recommendationsByExtra: Record<string, RecommendationSummary>;
  workedByExtra: Record<string, number>;
  paymentByExtra: Record<string, string>;
  cvByExtra: Record<string, { url: string; filename: string }>;
  gigEnded?: boolean;
  /** Interests this café has already reviewed. */
  reviewedInterestIds?: string[];
}) {
  const router = useRouter();
  const d = useDict();
  const loc = useLocaleTag();
  const [pending, startTransition] = useTransition();

  if (applicants.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={d.cafe.noApplicants}
        description={d.cafe.noApplicantsSub}
      />
    );
  }

  function decide(interestId: string, decision: "accepted" | "declined") {
    startTransition(async () => {
      const result = await decideInterest(interestId, decision);
      if (result.ok) {
        toast.success(decision === "accepted" ? d.cafe.acceptedToast : d.cafe.declinedToast);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function markShift(interestId: string, workStatus: "completed" | "no_show" | null) {
    startTransition(async () => {
      const result = await setWorkStatus(interestId, workStatus);
      if (result.ok) {
        toast.success(
          workStatus === "completed"
            ? d.cafe.shiftConfirmed
            : workStatus === "no_show"
              ? d.cafe.markedNoShow
              : d.cafe.cleared,
        );
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
          result.data?.recommended ? d.cafe.recAdded : d.cafe.recRemoved,
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
        const cv = extra ? cvByExtra[extra.id] : undefined;
        return (
          <li key={applicant.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-start gap-3.5">
              {extra ? (
                <Link href={`/cafe/baristas/${extra.id}`} className="pressable shrink-0 rounded-full">
                  <Avatar name={name} src={extra.profiles?.avatar_url} />
                </Link>
              ) : (
                <Avatar name={name} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {extra ? (
                    <Link
                      href={`/cafe/baristas/${extra.id}`}
                      className="font-medium transition-colors duration-150 hover:text-accent hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <p className="font-medium">{name}</p>
                  )}
                  <InterestStatusBadge status={applicant.status} />
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {[
                    extra?.years_experience != null ? d.barista.yrsExperience(extra.years_experience) : null,
                    extra?.hourly_rate_cents != null
                      ? `${formatMoney(extra.hourly_rate_cents, extra.currency)}${d.common.perHour}`
                      : null,
                    d.cafe.appliedRelative(formatRelative(applicant.created_at, loc)),
                    worked > 0 ? d.cafe.shiftsAtCafe(worked) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {extra && (extra.rates.length > 0 || extra.signature_drink || extra.instagram_handle || cv) ? (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
                    {extra.rates.map((rate) => (
                      <span key={rate.label}>
                        {rate.label} {formatMoney(rate.cents, extra.currency)}{d.common.perHour}
                      </span>
                    ))}
                    {extra.signature_drink ? <span>{d.barista.signature(extra.signature_drink)}</span> : null}
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
                    {cv ? (
                      <a
                        href={cv.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <FileText className="size-3.5" /> CV
                      </a>
                    ) : null}
                  </p>
                ) : null}
                {recs && recs.shopNames.length > 0 ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                    <ThumbsUp className="size-3.5" />
                    {d.cafe.recommendedByNames(recs.shopNames.join(", "))}
                  </p>
                ) : null}
                {extra && extra.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {extra.skills.map((skill) => (
                      <Badge key={skill}>{d.labels.skills[skill] ?? skillLabel(skill)}</Badge>
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
                      <Banknote className="size-3.5" /> {d.cafe.paymentDetails}
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
                        <Check className="size-4" /> {d.cafe.accept}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() => decide(applicant.id, "declined")}
                      >
                        <X className="size-4" /> {d.cafe.decline}
                      </Button>
                    </>
                  ) : null}
                  {applicant.status === "accepted" && conversationId ? (
                    <Link
                      href={`/messages/${conversationId}`}
                      className="pressable inline-flex items-center gap-1.5 rounded-sm bg-success-soft px-3 py-1.5 text-[13px] font-medium text-success"
                    >
                      <MessageSquare className="size-4" /> {d.cafe.openConversation}
                    </Link>
                  ) : null}
                  {applicant.status === "accepted" && gigEnded && !applicant.work_status ? (
                    <>
                      <Button
                        size="sm"
                        loading={pending}
                        onClick={() => markShift(applicant.id, "completed")}
                      >
                        <CheckCheck className="size-4" /> {d.cafe.workedShift}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() => markShift(applicant.id, "no_show")}
                      >
                        <UserX className="size-4" /> No-show
                      </Button>
                    </>
                  ) : null}
                  {applicant.work_status === "completed" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-success-soft px-3 py-1.5 text-[13px] font-medium text-success">
                      <CheckCheck className="size-4" /> {d.cafe.shiftConfirmed}
                    </span>
                  ) : null}
                  {applicant.work_status === "no_show" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-danger-soft px-3 py-1.5 text-[13px] font-medium text-danger">
                      <UserX className="size-4" /> {d.cafe.noShow}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => markShift(applicant.id, null)}
                        className="underline-offset-2 hover:underline"
                      >
                        {d.cafe.undo}
                      </button>
                    </span>
                  ) : null}
                  {applicant.status === "accepted" && extra ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() => recommend(extra.id)}
                      >
                        <ThumbsUp className="size-4" />
                        {recs?.mine ? d.cafe.recommended : d.cafe.recommend}
                      </Button>
                      <Link
                        href={`/cafe/gigs/new?from=${applicant.announcement_id}&invite=${extra.id}`}
                        className="pressable inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
                      >
                        <RotateCcw className="size-4" /> {d.cafe.rebook}
                      </Link>
                    </>
                  ) : null}
                </div>
                {applicant.work_status === "completed" &&
                !reviewedInterestIds.includes(applicant.id) ? (
                  <div className="mt-3">
                    <ReviewForm interestId={applicant.id} subject={name} />
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
