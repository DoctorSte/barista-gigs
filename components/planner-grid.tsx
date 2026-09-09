"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Inbox, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addStaff, removeStaff } from "@/app/actions/planner";
import {
  absRange,
  addDays,
  dateKey,
  fromDateKey,
  hoursLabel,
  rangesOverlap,
  shiftDuration,
  toMinutes,
} from "@/lib/planner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDict, useLocaleTag } from "@/components/i18n-provider";
import { PlannerEditor, type EditorState } from "@/components/planner-popovers";
import { cn } from "@/lib/utils";
import type { AnnouncementStatus, GigShift, OpeningHours, PayType } from "@/lib/database.types";

export type PlannerBlock = {
  id: string;
  kind: "gig" | "internal";
  date: string;
  start: string; // HH:MM
  end: string; // HH:MM; <= start means past midnight
  title: string;
  // gig blocks
  gigId?: string;
  shiftIndex?: number;
  status?: AnnouncementStatus;
  isSos?: boolean;
  pendingApplicants?: number;
  assigneeExtraIds?: string[];
  shiftCount?: number;
  allShifts?: GigShift[];
  description?: string;
  payRateCents?: number;
  payType?: PayType;
  requiredSkills?: string[];
  // internal blocks
  staffId?: string;
  plannerShiftId?: string;
  note?: string | null;
};

export type PlannerBarista = {
  extraId: string;
  name: string;
  avatarUrl: string | null;
  hourlyRateCents: number | null;
};

export type PlannerData = {
  weekStart: string;
  days: string[];
  todayKey: string;
  subscribed: boolean;
  shopName: string;
  openingHours: OpeningHours | null;
  blocks: PlannerBlock[];
  baristas: PlannerBarista[];
  staff: { id: string; name: string }[];
};

const GRID_COLS = "grid-cols-[180px_repeat(7,minmax(104px,1fr))]";

function blockRange(block: PlannerBlock): [number, number] {
  return absRange(block.date, toMinutes(block.start), toMinutes(block.end));
}

function blockMinutes(block: PlannerBlock): number {
  return shiftDuration(toMinutes(block.start), toMinutes(block.end));
}

export function PlannerGrid({ data }: { data: PlannerData }) {
  const d = useDict();
  const loc = useLocaleTag();
  const router = useRouter();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  const monday = fromDateKey(data.weekStart);
  const prevWeek = dateKey(addDays(monday, -7));
  const nextWeek = dateKey(addDays(monday, 7));
  const weekRangeLabel = `${monday.toLocaleDateString(loc, { day: "numeric", month: "short" })} – ${addDays(monday, 6).toLocaleDateString(loc, { day: "numeric", month: "long" })}`;

  const openBlocks = data.blocks.filter(
    (b) => b.kind === "gig" && (b.assigneeExtraIds?.length ?? 0) === 0,
  );
  const blocksForBarista = (extraId: string) =>
    data.blocks.filter((b) => b.kind === "gig" && b.assigneeExtraIds?.includes(extraId));
  const blocksForStaff = (staffId: string) =>
    data.blocks.filter((b) => b.kind === "internal" && b.staffId === staffId);

  // Double-booking: overlapping absolute ranges for the same person.
  const conflictIds = useMemo(() => {
    const flagged = new Set<string>();
    const perPerson = new Map<string, PlannerBlock[]>();
    for (const block of data.blocks) {
      if (block.kind === "internal" && block.staffId) {
        perPerson.set(`s:${block.staffId}`, [...(perPerson.get(`s:${block.staffId}`) ?? []), block]);
      }
      for (const extraId of block.assigneeExtraIds ?? []) {
        perPerson.set(`b:${extraId}`, [...(perPerson.get(`b:${extraId}`) ?? []), block]);
      }
    }
    for (const blocks of perPerson.values()) {
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const a = blocks[i]!;
          const b = blocks[j]!;
          if (a.id !== b.id && rangesOverlap(blockRange(a), blockRange(b))) {
            flagged.add(a.id);
            flagged.add(b.id);
          }
        }
      }
    }
    return flagged;
  }, [data.blocks]);

  // Day totals count real coverage: assigned gig shifts + internal shifts.
  const dayTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const block of data.blocks) {
      const covered =
        block.kind === "internal" ? 1 : (block.assigneeExtraIds?.length ?? 0);
      if (covered === 0) continue;
      totals.set(block.date, (totals.get(block.date) ?? 0) + blockMinutes(block) * covered);
    }
    return totals;
  }, [data.blocks]);

  function chipClass(block: PlannerBlock): string {
    const past = block.date < data.todayKey;
    if (block.kind === "internal") {
      return past
        ? "bg-muted text-muted-foreground border border-border"
        : "bg-primary text-primary-foreground border border-primary";
    }
    if (past || block.status === "closed" || block.status === "filled") {
      return "bg-muted text-muted-foreground border border-border";
    }
    if (block.isSos && (block.assigneeExtraIds?.length ?? 0) === 0) {
      return "bg-danger-soft text-danger border border-danger/40";
    }
    if ((block.assigneeExtraIds?.length ?? 0) > 0) {
      return "bg-success-soft text-success border border-success/40";
    }
    return "bg-warning-soft text-warning border border-warning/40";
  }

  function submitAddStaff() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await addStaff(name);
      if (result.ok) {
        toast.success(d.planner.personAdded);
        setNewName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmRemoveStaff(staffId: string) {
    if (!window.confirm(d.planner.removePersonConfirm)) return;
    startTransition(async () => {
      const result = await removeStaff(staffId);
      if (result.ok) {
        toast.success(d.planner.personRemoved);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function renderChip(block: PlannerBlock) {
    const conflict = conflictIds.has(block.id);
    return (
      <button
        key={block.id}
        type="button"
        onClick={() =>
          setEditor(
            block.kind === "internal"
              ? { type: "detail-internal", block }
              : { type: "detail-gig", block },
          )
        }
        title={conflict ? d.planner.doubleBooked : block.title}
        className={cn(
          "pressable w-full rounded-sm px-1.5 py-1 text-left text-[11px] font-medium leading-tight outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          chipClass(block),
          conflict && "ring-2 ring-danger",
        )}
      >
        <span className="block truncate">
          {block.start}–{block.end}
          {toMinutes(block.end) <= toMinutes(block.start) ? (
            <span className="opacity-70"> {d.planner.pastMidnight}</span>
          ) : null}
          {block.kind === "gig" && (block.pendingApplicants ?? 0) > 0 && (block.assigneeExtraIds?.length ?? 0) === 0 ? (
            <span className="opacity-80"> · {block.pendingApplicants}</span>
          ) : null}
        </span>
        {block.title ? <span className="block truncate opacity-75">{block.title}</span> : null}
      </button>
    );
  }

  function renderCell(
    date: string,
    blocks: PlannerBlock[],
    onAdd: (() => void) | null,
    addLabel: string,
  ) {
    return (
      <div
        key={date}
        className={cn(
          "group flex min-h-14 flex-col gap-1 border-l border-border/60 p-1",
          date === data.todayKey && "bg-accent-soft/25",
        )}
      >
        {blocks.map(renderChip)}
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel}
            className={cn(
              "pressable flex h-6 items-center justify-center rounded-sm text-muted-foreground/0 outline-none",
              "transition-colors duration-100 hover:bg-muted hover:text-muted-foreground",
              "focus-visible:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
              "group-hover:text-muted-foreground/70",
              blocks.length === 0 && "flex-1",
            )}
          >
            <Plus className="size-3.5" />
          </button>
        ) : null}
      </div>
    );
  }

  function rowLabel(content: React.ReactNode, minutes: number) {
    return (
      <div className="flex items-center justify-between gap-2 py-2 pr-2">
        {content}
        {minutes > 0 ? (
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            {hoursLabel(minutes)}
          </span>
        ) : null}
      </div>
    );
  }

  const sumMinutes = (blocks: PlannerBlock[]) =>
    blocks.reduce((sum, b) => sum + blockMinutes(b), 0);

  return (
    <div>
      {/* Header: title + week nav */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {d.planner.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <CalendarDays className="size-4" />
            {d.planner.subtitle(weekRangeLabel)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/cafe/planner?week=${prevWeek}`}
            aria-label={d.planner.prevWeek}
            className="pressable flex size-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href="/cafe/planner"
            className="pressable flex h-9 items-center rounded-md border border-border bg-surface px-3.5 text-[13px] font-medium hover:bg-muted"
          >
            {d.planner.today}
          </Link>
          <Link
            href={`/cafe/planner?week=${nextWeek}`}
            aria-label={d.planner.nextWeek}
            className="pressable flex size-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="min-w-[960px]">
          {/* Day header */}
          <div className={cn("grid border-b border-border", GRID_COLS)}>
            <div />
            {data.days.map((date, index) => {
              const day = fromDateKey(date);
              const closed = data.openingHours ? data.openingHours[index] === null : false;
              return (
                <div
                  key={date}
                  className={cn(
                    "border-l border-border/60 px-2 py-2 text-center",
                    date === data.todayKey && "bg-accent-soft/25",
                  )}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {d.labels.weekdays[index]}
                  </p>
                  <p
                    className={cn(
                      "font-display text-lg font-semibold leading-tight",
                      date === data.todayKey && "text-accent",
                    )}
                  >
                    {day.getDate()}
                  </p>
                  {closed ? (
                    <p className="text-[10px] text-muted-foreground/70">{d.planner.closedDay}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Open shifts row */}
          <div className={cn("grid border-b border-border bg-muted/20", GRID_COLS)}>
            <div className="flex items-center gap-2 py-2 pl-3 pr-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-warning-soft text-warning">
                <Inbox className="size-3.5" />
              </span>
              <span className="text-sm font-medium">{d.planner.openRow}</span>
            </div>
            {data.days.map((date) =>
              renderCell(
                date,
                openBlocks.filter((b) => b.date === date),
                () => setEditor({ type: "create-gig", date }),
                d.planner.newGig,
              ),
            )}
          </div>

          {/* Barista rows */}
          {data.baristas.map((barista) => {
            const rowBlocks = blocksForBarista(barista.extraId);
            return (
              <div key={barista.extraId} className={cn("grid border-b border-border/70", GRID_COLS)}>
                <div className="pl-3">
                  {rowLabel(
                    <Link
                      href={`/cafe/baristas/${barista.extraId}`}
                      className="pressable flex min-w-0 items-center gap-2"
                    >
                      <Avatar name={barista.name} src={barista.avatarUrl} className="size-7 text-[11px]" />
                      <span className="truncate text-sm font-medium hover:text-accent">
                        {barista.name}
                      </span>
                    </Link>,
                    sumMinutes(rowBlocks),
                  )}
                </div>
                {data.days.map((date) =>
                  renderCell(
                    date,
                    rowBlocks.filter((b) => b.date === date),
                    () => setEditor({ type: "create-gig", date, barista }),
                    d.planner.newGigFor(barista.name),
                  ),
                )}
              </div>
            );
          })}

          {/* Staff rows */}
          {data.staff.map((person) => {
            const rowBlocks = blocksForStaff(person.id);
            return (
              <div key={person.id} className={cn("grid border-b border-border/70", GRID_COLS)}>
                <div className="pl-3">
                  {rowLabel(
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={person.name} className="size-7 text-[11px]" />
                      <span className="truncate text-sm font-medium">{person.name}</span>
                      <Badge className="shrink-0">{d.planner.staffTag}</Badge>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => confirmRemoveStaff(person.id)}
                        aria-label={d.planner.removePerson}
                        className="pressable rounded-sm p-0.5 text-muted-foreground/50 hover:text-danger"
                      >
                        <X className="size-3" />
                      </button>
                    </span>,
                    sumMinutes(rowBlocks),
                  )}
                </div>
                {data.days.map((date) =>
                  renderCell(
                    date,
                    rowBlocks.filter((b) => b.date === date),
                    () => setEditor({ type: "create-internal", date, staff: person }),
                    d.planner.newInternal(person.name),
                  ),
                )}
              </div>
            );
          })}

          {/* Empty-roster hint */}
          {data.baristas.length === 0 && data.staff.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">{d.planner.noPeople}</div>
          ) : null}

          {/* Day totals + add person */}
          <div className={cn("grid", GRID_COLS)}>
            <div className="flex items-center gap-1.5 py-2 pl-3 pr-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAddStaff();
                }}
                placeholder={d.planner.addPersonPlaceholder}
                aria-label={d.planner.addPerson}
                className="h-7 w-full min-w-0 rounded-sm border border-border bg-surface px-2 text-[12px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                disabled={pending || !newName.trim()}
                onClick={submitAddStaff}
                className="pressable flex h-7 shrink-0 items-center rounded-sm border border-border-strong bg-surface px-2 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
              >
                {d.planner.add}
              </button>
            </div>
            {data.days.map((date) => {
              const minutes = dayTotals.get(date) ?? 0;
              return (
                <div
                  key={date}
                  className={cn(
                    "border-l border-border/60 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground",
                    date === data.todayKey && "bg-accent-soft/25",
                  )}
                >
                  {minutes > 0 ? hoursLabel(minutes) : "—"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PlannerEditor
        editor={editor}
        onClose={() => setEditor(null)}
        subscribed={data.subscribed}
        shopName={data.shopName}
        openingHours={data.openingHours}
        staff={data.staff}
      />
    </div>
  );
}
