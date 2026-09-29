"use client";

import Link from "next/link";
import {useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Inbox,
  Users,
  Wand2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { copyPreviousWeek } from "@/app/actions/planner";
import { applyDefaultWeek, removeTimeOff } from "@/app/actions/staff";
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
import { PlannerDayView } from "@/components/planner-day-view";
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
  staff: {
    id: string;
    name: string;
    weeklyHoursTarget: number | null;
    hasDefaultWeek: boolean;
    hasAccount: boolean;
  }[];
  timeOff: { id: string; staffId: string; date: string; note: string | null }[];
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
  const [fillOpen, setFillOpen] = useState(false);
  const fillMenuRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!fillOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!fillMenuRef.current?.contains(event.target as Node)) setFillOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFillOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fillOpen]);

  // View and selected day live in the URL so week navigation keeps them and a
  // particular day is shareable, the same way ?week= already is.
  const params = useSearchParams();
  const view = params.get("view") === "day" ? "day" : "week";
  const dayParam = params.get("day");
  const activeDay =
    dayParam && data.days.includes(dayParam)
      ? dayParam
      : data.days.includes(data.todayKey)
        ? data.todayKey
        : data.days[0]!;

  function plannerHref(next: { week?: string; view?: "week" | "day"; day?: string | null }) {
    const search = new URLSearchParams();
    const week = next.week ?? data.weekStart;
    if (week) search.set("week", week);
    const nextView = next.view ?? view;
    if (nextView === "day") search.set("view", "day");
    const day = next.day === undefined ? activeDay : next.day;
    if (nextView === "day" && day) search.set("day", day);
    return `/cafe/planner?${search.toString()}`;
  }

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

  // Days a staff member marked off, keyed staffId|date.
  const offByStaffDay = new Map(data.timeOff.map((t) => [`${t.staffId}|${t.date}`, t]));

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

  function runCopyLastWeek() {
    startTransition(async () => {
      const result = await copyPreviousWeek(data.weekStart);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const copied = result.data?.copied ?? 0;
      if (copied === 0) toast.info(d.planner.nothingToCopy);
      else {
        toast.success(d.planner.copied(copied));
        router.refresh();
      }
    });
  }

  function runFillDefaults() {
    startTransition(async () => {
      const result = await applyDefaultWeek(data.weekStart);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const created = result.data?.created ?? 0;
      if (created === 0) toast.info(d.planner.nothingToFill);
      else {
        toast.success(d.planner.filledFromDefault(created));
        router.refresh();
      }
    });
  }

  function confirmRemoveTimeOff(id: string) {
    startTransition(async () => {
      const result = await removeTimeOff(id);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function renderChip(block: PlannerBlock, offConflict = false) {
    const conflict = conflictIds.has(block.id) || offConflict;
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
          conflict && "border-danger bg-danger text-white",
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
    off?: { id: string; note: string | null },
  ) {
    return (
      <div
        key={date}
        className={cn(
          "group flex min-h-14 flex-col gap-1 border-l border-border/60 p-1",
          date === data.todayKey && "bg-accent-soft/25",
        )}
      >
        {off ? (
          <button
            type="button"
            title={off.note ?? d.planner.offDay}
            onClick={() => {
              if (window.confirm(`${d.planner.offDay} — ${d.common.remove}?`)) {
                confirmRemoveTimeOff(off.id);
              }
            }}
            className="pressable w-full rounded-sm border border-dashed border-border-strong bg-[repeating-linear-gradient(135deg,transparent_0_4px,var(--muted)_4px_8px)] px-1.5 py-0.5 text-left text-[11px] font-medium text-muted-foreground"
          >
            {d.planner.offDay}
            {off.note ? ` · ${off.note.slice(0, 24)}` : ""}
          </button>
        ) : null}
        {blocks.map((block) => renderChip(block, Boolean(off) && block.kind === "internal"))}
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

  function rowLabel(content: React.ReactNode, minutes: number, target?: number | null) {
    const met = target != null && minutes >= target * 60;
    return (
      <div className="flex items-center justify-between gap-2 py-2 pr-2">
        {content}
        {target != null ? (
          <span
            className={cn(
              "shrink-0 text-[11px] font-medium tabular-nums",
              met ? "text-success" : "text-muted-foreground",
            )}
            title={met ? undefined : d.planner.hoursShort(`${hoursLabel(minutes)} / ${target}h`)}
          >
            {hoursLabel(minutes)} / {target}h{met ? " ✓" : ""}
          </span>
        ) : minutes > 0 ? (
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            {hoursLabel(minutes)}
          </span>
        ) : null}
      </div>
    );
  }

  const dayRows = [
    {
      key: "open",
      name: d.planner.openRow,
      kind: "open" as const,
      blocks: openBlocks.filter((b) => b.date === activeDay),
      weekMinutes: 0,
    },
    ...data.baristas.map((barista) => {
      const rowBlocks = blocksForBarista(barista.extraId);
      return {
        key: `barista:${barista.extraId}`,
        name: barista.name,
        avatarUrl: barista.avatarUrl,
        kind: "barista" as const,
        blocks: rowBlocks.filter((b) => b.date === activeDay),
        weekMinutes: rowBlocks.reduce((sum, b) => sum + blockMinutes(b), 0),
      };
    }),
    ...data.staff.map((person) => {
      const rowBlocks = blocksForStaff(person.id);
      return {
        key: `staff:${person.id}`,
        name: person.name,
        kind: "staff" as const,
        blocks: rowBlocks.filter((b) => b.date === activeDay),
        weekMinutes: rowBlocks.reduce((sum, b) => sum + blockMinutes(b), 0),
        weeklyHoursTarget: person.weeklyHoursTarget,
        off: offByStaffDay.has(`${person.id}|${activeDay}`),
      };
    }),
  ].filter((row) => row.kind !== "barista" || row.blocks.length > 0);

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
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {d.planner.subtitle(weekRangeLabel)}
            </span>
            <Link
              href="/cafe/staff"
              className="flex items-center gap-1 text-[13px] font-medium underline-offset-2 hover:text-foreground hover:underline"
            >
              <Users className="size-3.5" /> {d.planner.manageStaff}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-1 grid h-9 grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup">
            {(
              [
                { value: "week", label: d.planner.week },
                { value: "day", label: d.planner.day },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={view === option.value}
                onClick={() => router.replace(plannerHref({ view: option.value }), { scroll: false })}
                className={cn(
                  "pressable rounded-sm px-3 text-[13px] font-medium outline-none transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  view === option.value
                    ? "bg-surface-raised text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* Week nav reads as one control, not three buttons. */}
          <div className="flex h-9 items-center overflow-hidden rounded-md border border-border bg-surface">
            <Link
              href={plannerHref({ week: prevWeek, day: null })}
              aria-label={d.planner.prevWeek}
              className="flex h-full w-9 items-center justify-center hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={plannerHref({ week: data.todayKey, day: null })}
              className="flex h-full items-center border-x border-border px-3.5 text-[13px] font-medium hover:bg-muted"
            >
              {d.planner.today}
            </Link>
            <Link
              href={plannerHref({ week: nextWeek, day: null })}
              aria-label={d.planner.nextWeek}
              className="flex h-full w-9 items-center justify-center hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Both week-filling moves live under one menu. */}
          <div ref={fillMenuRef} className="relative">
            <button
              type="button"
              disabled={pending}
              aria-expanded={fillOpen}
              aria-haspopup="true"
              onClick={() => setFillOpen((value) => !value)}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-60"
            >
              <Wand2 className="size-3.5" /> {d.planner.fillMenu}
              <ChevronDown className="size-3 opacity-60" />
            </button>
            {fillOpen ? (
              <div className="menu-panel absolute right-0 z-40 mt-1.5 w-60 rounded-md border border-border bg-surface-raised p-1.5 shadow-lg shadow-black/8">
                <button
                  type="button"
                  onClick={() => {
                    setFillOpen(false);
                    runCopyLastWeek();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-[13px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted"
                >
                  <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                  {d.planner.copyLastWeek}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFillOpen(false);
                    runFillDefaults();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-[13px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted"
                >
                  <Wand2 className="size-3.5 shrink-0 text-muted-foreground" />
                  {d.planner.fillDefaultWeek}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {view === "day" ? (
        <PlannerDayView
          data={data}
          date={activeDay}
          rows={dayRows}
          conflictIds={conflictIds}
          onSelectDate={(day) => router.replace(plannerHref({ day }), { scroll: false })}
          onOpenBlock={(block) =>
            setEditor(
              block.kind === "internal"
                ? { type: "detail-internal", block }
                : { type: "detail-gig", block },
            )
          }
          onCreateGig={(date) => setEditor({ type: "create-gig", date })}
          onCreateInternal={(staffId, date) => {
            const person = data.staff.find((s) => s.id === staffId);
            if (person) setEditor({ type: "create-internal", date, staff: person });
          }}
        />
      ) : (
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
            if (rowBlocks.length === 0) return null;
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
                  renderCell(date, rowBlocks.filter((b) => b.date === date), null, ""),
                )}
              </div>
            );
          })}

          {/* Staff rows */}
          {data.staff.map((person) => {
            const rowBlocks = blocksForStaff(person.id);
            const minutes = sumMinutes(rowBlocks);
            const target = person.weeklyHoursTarget;
            const met = target != null && minutes >= target * 60;
            return (
              <div key={person.id} className={cn("grid border-b border-border/70", GRID_COLS)}>
                <div className="pl-3">
                  {/* Hours sit under the name — beside it, a long name or a
                      wide "x / y" figure squeezes the other out of the column. */}
                  {rowLabel(
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar name={person.name} className="size-7 text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{person.name}</span>
                          <Badge className="shrink-0">{d.planner.staffTag}</Badge>
                        </span>
                        {target != null || minutes > 0 ? (
                          <span
                            className={cn(
                              "block text-[11px] font-medium tabular-nums",
                              met ? "text-success" : "text-muted-foreground",
                            )}
                          >
                            {hoursLabel(minutes)}
                            {target != null ? ` / ${target}h` : ""}
                            {met ? " ✓" : ""}
                          </span>
                        ) : null}
                      </span>
                    </span>,
                    0,
                  )}
                </div>
                {data.days.map((date) =>
                  renderCell(
                    date,
                    rowBlocks.filter((b) => b.date === date),
                    () => setEditor({ type: "create-internal", date, staff: person }),
                    d.planner.newInternal(person.name),
                    offByStaffDay.get(`${person.id}|${date}`),
                  ),
                )}
              </div>
            );
          })}

          {/* Empty-roster hint */}
          {data.baristas.length === 0 && data.staff.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">{d.planner.noPeople}</div>
          ) : null}

          {/* Day totals */}
          <div className={cn("grid", GRID_COLS)}>
            <div className="flex items-center justify-between py-2 pl-3 pr-2 text-[11px] font-medium text-muted-foreground">
              <span className="uppercase tracking-[0.14em]">{d.planner.totalRow}</span>
              <span className="tabular-nums">
                {hoursLabel([...dayTotals.values()].reduce((sum, m) => sum + m, 0))}
              </span>
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

      )}

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
