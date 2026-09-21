"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { sendReferralInvite } from "@/app/actions/referrals";
import { Avatar } from "@/components/ui/avatar";
import { useDict } from "@/components/i18n-provider";
import { CREW_TIERS, crewTier } from "@/lib/crew";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation";
import { Section } from "@/components/ui/section";

export type CrewMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
  shifts: number;
  joinedLabel: string;
};

/**
 * "Build your crew" — the baristas who joined through this barista's link,
 * with milestone badges. Status only: no payout is attached.
 */
export function CrewSection({
  code,
  crew,
  invited,
}: {
  code: string;
  crew: CrewMember[];
  /** Addresses already invited to the crew, newest first. */
  invited: string[];
}) {
  const d = useDict();
  const router = useRouter();
  const path = `/r/${code}`;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, sending] = useActionState<ActionResult | null, FormData>(
    sendReferralInvite,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(d.crew.inviteSent);
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router, d]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(d.common.copied);
    } catch {
      toast.error(d.common.copyFailed);
    }
  }

  const tier = crewTier(crew.length);
  const LAST_TIER = CREW_TIERS[CREW_TIERS.length - 1]!;
  const shiftsTogether = crew.reduce((sum, member) => sum + member.shifts, 0);

  return (
    <Section
      title={d.crew.title}
      hint={crew.length === 0 ? d.crew.sub : d.crew.joined(crew.length)}
      aside={
        tier.reached > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-muted px-3 py-1 text-[13px] font-medium">
            <span aria-hidden>{"☕".repeat(tier.reached)}</span>
            {d.crew.tiers[tier.reached - 1]}
          </span>
        ) : null
      }
    >

      {/* Milestone track — each badge sits at its own crew size. */}
      <div className="mt-1 pr-1">
        <div className="relative h-1 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-700"
            style={{ width: `${Math.min((crew.length / LAST_TIER) * 100, 100)}%` }}
          />
          {CREW_TIERS.map((threshold, index) => {
            const earned = crew.length >= threshold;
            return (
              <span
                key={threshold}
                style={{ left: `${(threshold / LAST_TIER) * 100}%` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <span
                  className={cn(
                    "block size-3 rounded-full border-2 transition-colors duration-300",
                    earned ? "border-foreground bg-foreground" : "border-border-strong bg-surface",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-center text-[11px] leading-tight",
                    earned ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="block font-medium tabular-nums">{threshold}</span>
                  <span className="block">{d.crew.tiers[index]}</span>
                </span>
              </span>
            );
          })}
        </div>
        <p className="mt-10 text-[13px] text-muted-foreground">
          {tier.next === null
            ? d.crew.allEarned
            : d.crew.nextTier(d.crew.tiers[tier.reached]!, tier.toGo)}
        </p>
      </div>

      <form ref={formRef} action={formAction} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="audience" value="barista" />
        <input
          type="email"
          name="email"
          required
          placeholder={d.crew.invitePlaceholder}
          aria-label={d.crew.inviteLabel}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={sending}
          className="pressable inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {sending ? d.common.loading : d.crew.invite}
        </button>
      </form>
      <button
        type="button"
        onClick={copy}
        className="pressable mt-2 inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Copy className="size-3.5" />
        {d.crew.copyLink(path)}
      </button>
      {invited.length > 0 ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {d.crew.inviteWaiting(invited.length)}{" "}
          <span className="text-foreground">{invited.join(", ")}</span>
        </p>
      ) : null}

      {crew.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium">
            {d.crew.yourCrew}
            {shiftsTogether > 0 ? (
              <span className="font-normal text-muted-foreground">
                {" · "}
                {d.crew.shiftsTogether(shiftsTogether)}
              </span>
            ) : null}
          </p>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {crew.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={member.name} src={member.avatarUrl} className="size-7 text-[11px]" />
                  <span className="truncate font-medium">{member.name}</span>
                  <span className="truncate text-[12px] text-muted-foreground">
                    {member.joinedLabel}
                  </span>
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {member.shifts > 0 ? d.crew.memberShifts(member.shifts) : d.crew.noShiftsYet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}