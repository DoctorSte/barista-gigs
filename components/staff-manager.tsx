"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Mail, Plus, Search, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import { addStaff, removeStaff } from "@/app/actions/planner";
import {
  inviteStaff,
  revokeStaffInvite,
  searchBaristas,
  unlinkStaff,
  updateStaffContract,
} from "@/app/actions/staff";
import { WeekHoursEditor } from "@/components/week-hours-editor";
import { Avatar } from "@/components/ui/avatar";
import { useDict } from "@/components/i18n-provider";
import { hoursLabel, toMinutes } from "@/lib/planner";
import type { AvailabilityWindow, OpeningHours } from "@/lib/database.types";
import type { ActionResult } from "@/lib/validation";

export type StaffRow = {
  id: string;
  name: string;
  weeklyHoursTarget: number | null;
  defaultWeek: AvailabilityWindow[];
  linked: { name: string; avatarUrl: string | null } | null;
  inviteEmail: string | null;
  invitePending: boolean;
};

export function StaffManager({
  staff,
  openingHours,
}: {
  staff: StaffRow[];
  openingHours: OpeningHours | null;
}) {
  const d = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");

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

  return (
    <div className="flex flex-col gap-4">
      {staff.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <p className="font-display text-lg font-semibold tracking-tight">{d.staff.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{d.staff.emptySub}</p>
        </div>
      ) : (
        staff.map((person) => (
          <StaffCard
            key={person.id}
            person={person}
            openingHours={openingHours}
            pending={pending}
            run={run}
          />
        ))
      )}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = newName.trim();
          if (!name) return;
          startTransition(async () => {
            const result = await addStaff(name);
            if (result.ok) {
              setNewName("");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      >
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={d.staff.addPlaceholder}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={pending || !newName.trim()}
          className="pressable inline-flex h-10 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          <Plus className="size-4" /> {d.staff.add}
        </button>
      </form>
    </div>
  );
}

function StaffCard({
  person,
  openingHours,
  pending,
  run,
}: {
  person: StaffRow;
  openingHours: OpeningHours | null;
  pending: boolean;
  run: (action: () => Promise<ActionResult>, successMessage: string) => void;
}) {
  const d = useDict();
  const [target, setTarget] = useState(
    person.weeklyHoursTarget == null ? "" : String(person.weeklyHoursTarget),
  );
  const [week, setWeek] = useState<AvailabilityWindow[]>(person.defaultWeek);
  const [dirty, setDirty] = useState(false);

  const defaultMinutes = week.reduce(
    (sum, w) => sum + Math.max(toMinutes(w.end) - toMinutes(w.start), 0),
    0,
  );

  function save() {
    run(
      () =>
        updateStaffContract({
          staffId: person.id,
          weeklyHoursTarget: target.trim() === "" ? null : Number(target),
          defaultWeek: week,
        }),
      d.staff.saved,
    );
    setDirty(false);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-semibold tracking-tight">{person.name}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(d.staff.confirmRemove(person.name))) {
              run(() => removeStaff(person.id), d.staff.removed);
            }
          }}
          className="pressable inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-danger"
        >
          <UserMinus className="size-3.5" /> {d.staff.remove}
        </button>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{d.staff.contractedHours}</span>
          <input
            type="number"
            min={1}
            max={80}
            value={target}
            placeholder={d.staff.noTarget}
            onChange={(event) => {
              setTarget(event.target.value);
              setDirty(true);
            }}
            className="h-10 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="min-w-0">
          <p className="text-[13px] font-medium">
            {d.staff.defaultWeek}
            {defaultMinutes > 0 ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {hoursLabel(defaultMinutes)}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{d.staff.defaultWeekHint}</p>
          <div className="mt-2.5">
            <WeekHoursEditor
              windows={week}
              onChange={(next) => {
                setWeek(next);
                setDirty(true);
              }}
              bounds={openingHours}
            />
          </div>
        </div>
      </div>

      {dirty ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="pressable inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {d.common.save}
          </button>
        </div>
      ) : null}

      <AccountSection person={person} pending={pending} run={run} />
    </div>
  );
}

function AccountSection({
  person,
  pending,
  run,
}: {
  person: StaffRow;
  pending: boolean;
  run: (action: () => Promise<ActionResult>, successMessage: string) => void;
}) {
  const d = useDict();
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ userId: string; name: string; avatarUrl: string | null }[]>([]);
  const [, startSearch] = useTransition();
  const searchSeq = useRef(0);

  function onQueryChange(value: string) {
    setQuery(value);
    const seq = ++searchSeq.current;
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const result = await searchBaristas(value);
      if (seq === searchSeq.current && result.ok) setResults(result.data ?? []);
    });
  }

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="text-[13px] font-medium">{d.staff.account}</p>

      {person.linked ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Avatar
              name={person.linked.name}
              src={person.linked.avatarUrl}
              className="size-7 text-[11px]"
            />
            <span className="truncate font-medium">{d.staff.linkedTo(person.linked.name)}</span>
            <span className="hidden text-[12px] text-muted-foreground sm:inline">
              {d.staff.linkedHint}
            </span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => unlinkStaff(person.id), d.staff.unlinked)}
            className="pressable inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-danger"
          >
            <X className="size-3.5" /> {d.staff.unlink}
          </button>
        </div>
      ) : person.invitePending ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" />
            {person.inviteEmail
              ? d.staff.invitePending(person.inviteEmail)
              : d.staff.invitePendingGeneric}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => revokeStaffInvite(person.id), d.staff.revoked)}
            className="pressable inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-danger"
          >
            <X className="size-3.5" /> {d.staff.revoke}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-[12px] text-muted-foreground">{d.staff.noAccountHint}</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                run(() => inviteStaff({ staffId: person.id, email }), d.staff.inviteSent);
                setEmail("");
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={d.staff.emailPlaceholder}
                aria-label={d.staff.inviteByEmail}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-[13px] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={pending || !email.trim()}
                className="pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-60"
              >
                <Mail className="size-3.5" /> {d.staff.sendInvite}
              </button>
            </form>

            <div className="relative">
              <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={d.staff.searchPlaceholder}
                  aria-label={d.staff.orLink}
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              {results.length > 0 ? (
                <ul className="menu-panel absolute inset-x-0 top-10 z-30 rounded-md border border-border bg-surface-raised p-1.5 shadow-lg shadow-black/8">
                  {results.map((match) => (
                    <li key={match.userId}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          run(
                            () => inviteStaff({ staffId: person.id, extraUserId: match.userId }),
                            d.staff.inviteSent,
                          );
                          setQuery("");
                          setResults([]);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar
                            name={match.name}
                            src={match.avatarUrl}
                            className="size-6 text-[10px]"
                          />
                          <span className="truncate">{match.name}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                          <Link2 className="size-3.5" /> {d.staff.link}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
