"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import { inviteMember, removeMember, revokeInvite } from "@/app/actions/team";
import type { ActionResult } from "@/lib/validation";
import { useDict } from "@/components/i18n-provider";

export type TeamMemberRow = { id: string; name: string; email: string | null };
export type TeamInviteRow = { id: string; email: string };

export function TeamManager({
  members,
  invites,
  seatCap,
  planName,
  canInviteMore,
}: {
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
  seatCap: number;
  planName: string;
  /** False when every seat (owner + members + pending invites) is taken. */
  canInviteMore: boolean;
}) {
  const d = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, inviting] = useActionState<ActionResult | null, FormData>(
    inviteMember,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(d.cafe.inviteSent);
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router, d]);

  function run(action: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const seatsUsed = 1 + members.length + invites.length;

  return (
    <div>
      {members.length > 0 || invites.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1.5">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{member.name}</span>
                {member.email ? (
                  <span className="truncate text-[12px] text-muted-foreground">{member.email}</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeMember(member.id), d.cafe.memberRemoved)}
                className="pressable inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-danger"
              >
                <UserMinus className="size-3.5" /> {d.common.remove}
              </button>
            </li>
          ))}
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border bg-surface px-3.5 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{invite.email}</span>
                <span className="text-[12px]">{d.cafe.invited}</span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => revokeInvite(invite.id), d.cafe.inviteRevoked)}
                className="pressable inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-danger"
              >
                <X className="size-3.5" /> {d.cafe.revoke}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {canInviteMore ? (
        <form ref={formRef} action={formAction} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder={d.cafe.teamPlaceholder}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={inviting}
            className="pressable inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {inviting ? d.common.loading : d.cafe.sendInvite}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {seatCap === 1 ? (
            <>
              {d.cafe.singleSeat(planName)}{" "}
              <Link
                href="/settings/billing"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                {d.cafe.upgradeSeats}
              </Link>
              .
            </>
          ) : (
            <>
              {d.cafe.seatsTaken(seatCap, planName, seatsUsed)}
              {seatCap < 10 ? (
                <>
                  {" "}
                  <Link
                    href="/settings/billing"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {d.cafe.upgradeMore}
                  </Link>
                  .
                </>
              ) : null}
            </>
          )}
        </p>
      )}
    </div>
  );
}
