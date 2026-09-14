"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { movePlannerShift } from "@/app/actions/planner";
import { fromDateKey, hoursLabel, shiftDuration, toHHMM, toMinutes } from "@/lib/planner";
import { Avatar } from "@/components/ui/avatar";
import { useDict, useLocaleTag } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { PlannerBlock, PlannerData } from "@/components/planner-grid";

const SNAP = 30; // minutes
const MIN_DURATION = 60;
const LANE_HEIGHT = 30; // px per stacked bar inside a row

type Row = {
  key: string;
  name: string;
  avatarUrl?: string | null;
  kind: "open" | "barista" | "staff";
  blocks: PlannerBlock[];
  weekMinutes: number;
};

function blockMinutes(block: PlannerBlock): number {
  return shiftDuration(toMinutes(block.start), toMinutes(block.end));
}

/**
 * Stacks a row's shifts into lanes so two that run at the same time sit above
 * each other instead of one hiding the other. Overlapping is normal — several
 * gigs can run at once — so lanes carry no warning of their own. Lanes come
 * from the saved times, not the dragged ones, so the row doesn't reshuffle
 * under the pointer mid-drag.
 */
function assignLanes(blocks: PlannerBlock[]): { lane: Map<string, number>; lanes: number } {
  const lane = new Map<string, number>();
  const laneEnds: number[] = [];
  for (const block of [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))) {
    const start = toMinutes(block.start);
    let slot = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (slot === -1) slot = laneEnds.length;
    laneEnds[slot] = start + blockMinutes(block);
    lane.set(block.id, slot);
  }
  return { lane, lanes: Math.max(laneEnds.length, 1) };
}

/**
 * A single day on a time axis: one row per person, shifts as bars. Staff
 * shifts can be dragged along the axis or resized by their edges; gig shifts
 * are read-only here and open their detail dialog on click.
 */
export function PlannerDayView({
  data,
  date,
  rows,
  conflictIds,
  onSelectDate,
  onOpenBlock,
  onCreateInternal,
  onCreateGig,
}: {
  data: PlannerData;
  date: string;
  rows: Row[];
  /** Same-person double-bookings, computed once for the whole week. */
  conflictIds: Set<string>;
  onSelectDate: (date: string) => void;
  onOpenBlock: (block: PlannerBlock) => void;
  onCreateInternal: (staffId: string, date: string) => void;
  onCreateGig: (date: string) => void;
}) {
  const d = useDict();
  const loc = useLocaleTag();
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Each row's track element, measured for pointer→minute maths.
  const trackRefs = useRef(new Map<string, HTMLElement>());
  // While dragging we render from local state so the bar tracks the pointer.
  const [draft, setDraft] = useState<{ id: string; start: number; end: number } | null>(null);
  // A drag ends with a click event; this stops that click opening the dialog.
  const movedRef = useRef(false);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "start" | "end";
    rect: DOMRect;
    grabOffset: number;
    start: number;
    end: number;
  } | null>(null);

  // The window the axis spans: opening hours, widened to fit every shift.
  const weekdayIndex = (fromDateKey(date).getDay() + 6) % 7;
  const opening = data.openingHours?.[weekdayIndex] ?? null;
  const dayBlocks = rows.flatMap((row) => row.blocks);
  let min = opening ? toMinutes(opening.open) : 7 * 60;
  let max = opening ? toMinutes(opening.close) : 20 * 60;
  for (const block of dayBlocks) {
    const start = toMinutes(block.start);
    min = Math.min(min, start);
    max = Math.max(max, start + blockMinutes(block));
  }
  min = Math.max(0, Math.floor(min / 60) * 60 - 30);
  max = Math.min(1440, Math.ceil(max / 60) * 60 + 30);
  if (max - min < 240) max = Math.min(1440, min + 240);
  const span = max - min;

  const hourMarks: number[] = [];
  for (let m = Math.ceil(min / 60) * 60; m <= max; m += 60) hourMarks.push(m);

  const percent = (minutes: number) => ((minutes - min) / span) * 100;

  function liveTimes(block: PlannerBlock) {
    if (draft && draft.id === block.id) return { start: draft.start, end: draft.end };
    const start = toMinutes(block.start);
    return { start, end: start + blockMinutes(block) };
  }

  function snap(minutes: number) {
    return Math.round(minutes / SNAP) * SNAP;
  }

  function minutesFromPointer(clientX: number, rect: DOMRect) {
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return snap(min + ratio * span);
  }

  function startDrag(
    event: React.PointerEvent,
    block: PlannerBlock,
    mode: "move" | "start" | "end",
    track: HTMLElement,
  ) {
    if (block.kind !== "internal" || !block.plannerShiftId) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = track.getBoundingClientRect();
    const { start, end } = liveTimes(block);
    dragRef.current = {
      id: block.id,
      mode,
      rect,
      grabOffset: minutesFromPointer(event.clientX, rect) - start,
      start,
      end,
    };
    setDraft({ id: block.id, start, end });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const pointer = minutesFromPointer(event.clientX, drag.rect);
    if (drag.mode === "move") {
      const duration = drag.end - drag.start;
      let start = snap(pointer - drag.grabOffset);
      start = Math.min(Math.max(start, 0), 1440 - duration);
      setDraft({ id: drag.id, start, end: start + duration });
    } else if (drag.mode === "start") {
      const start = Math.min(Math.max(pointer, 0), drag.end - MIN_DURATION);
      setDraft({ id: drag.id, start, end: drag.end });
    } else {
      const end = Math.max(Math.min(pointer, 1440), drag.start + MIN_DURATION);
      setDraft({ id: drag.id, start: drag.start, end });
    }
  }

  function endDrag(block: PlannerBlock) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !draft || draft.id !== block.id || !block.plannerShiftId) {
      setDraft(null);
      return;
    }
    const { start, end } = draft;
    setDraft(null);
    if (start === drag.start && end === drag.end) return;
    movedRef.current = true;
    startTransition(async () => {
      const result = await movePlannerShift({
        id: block.plannerShiftId!,
        date,
        startMin: start,
        endMin: end >= 1440 ? 1440 : end,
      });
      if (result.ok) {
        toast.success(d.planner.shiftSaved);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  // How many people are on at each half hour — the overlap read at a glance.
  const slots = Math.max(1, Math.round(span / SNAP));
  const coverage = Array.from({ length: slots }, (_, index) => {
    const slotStart = min + index * SNAP;
    return dayBlocks.filter((block) => {
      if (block.kind === "gig" && (block.assigneeExtraIds?.length ?? 0) === 0) return false;
      const start = toMinutes(block.start);
      return slotStart >= start && slotStart < start + blockMinutes(block);
    }).length;
  });
  const peak = Math.max(1, ...coverage);

  function barClass(block: PlannerBlock, past: boolean): string {
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

  const past = date < data.todayKey;

  return (
    <div className="flex flex-col gap-3">
      {/* Every day of the week stays one click away */}
      <div className="flex flex-wrap gap-1.5">
        {data.days.map((key) => {
          const dayDate = fromDateKey(key);
          const active = key === date;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectDate(key)}
              className={cn(
                "pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-foreground bg-foreground text-background"
                  : key === data.todayKey
                    ? "border-border-strong bg-surface text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {dayDate.toLocaleDateString(loc, { weekday: "short" })}
              <span className={active ? "" : "text-muted-foreground"}>{dayDate.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="min-w-[720px]">
          {/* Hour ruler */}
          <div className="flex border-b border-border">
            <div className="w-48 shrink-0 border-r border-border/60" />
            <div className="relative h-7 flex-1">
              {hourMarks.map((mark) => (
                <span
                  key={mark}
                  className="absolute top-1.5 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground"
                  style={{ left: `${percent(mark)}%` }}
                >
                  {toHHMM(mark)}
                </span>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{d.planner.noOneOn}</p>
          ) : null}

          {rows.map((row) => {
            const { lane, lanes } = assignLanes(row.blocks);
            return (
            <div key={row.key} className="flex border-b border-border/60 last:border-b-0">
              <div className="flex w-48 shrink-0 items-center gap-2 border-r border-border/60 px-3 py-2">
                {row.kind === "open" ? null : (
                  <Avatar name={row.name} src={row.avatarUrl} className="size-6 text-[10px]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{row.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {row.blocks.length > 0
                      ? d.planner.dayHours(
                          hoursLabel(row.blocks.reduce((sum, b) => sum + blockMinutes(b), 0)),
                        )
                      : "—"}
                    {row.weekMinutes > 0 ? ` · ${d.planner.weekHours(hoursLabel(row.weekMinutes))}` : ""}
                  </p>
                </div>
                {row.kind === "barista" ? null : (
                  <button
                    type="button"
                    aria-label={row.kind === "open" ? d.planner.newGig : d.planner.newInternal(row.name)}
                    onClick={() =>
                      row.kind === "open"
                        ? onCreateGig(date)
                        : onCreateInternal(row.key.replace("staff:", ""), date)
                    }
                    className="pressable flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors duration-100 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>

              <div
                className="relative flex-1"
                style={{ height: lanes * LANE_HEIGHT + 12 }}
                onPointerMove={onPointerMove}
                ref={(element) => {
                  if (element) trackRefs.current.set(row.key, element);
                }}
              >
                {/* Hour gridlines */}
                {hourMarks.map((mark) => (
                  <span
                    key={mark}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-border/50"
                    style={{ left: `${percent(mark)}%` }}
                  />
                ))}

                {row.blocks.map((block) => {
                  const { start, end } = liveTimes(block);
                  const conflict = conflictIds.has(block.id);
                  const draggable = block.kind === "internal";
                  const overnight = end > 1440;
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute flex items-center rounded-md px-2 text-[11px] font-medium shadow-sm",
                        barClass(block, past),
                        draggable ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer",
                        conflict && "ring-1 ring-danger",
                        draft?.id === block.id && "z-10 ring-2 ring-ring",
                      )}
                      style={{
                        left: `${percent(start)}%`,
                        width: `${Math.max(((Math.min(end, max) - start) / span) * 100, 4)}%`,
                        top: (lane.get(block.id) ?? 0) * LANE_HEIGHT + 6,
                        height: LANE_HEIGHT - 6,
                      }}
                      onPointerDown={(event) => {
                        const track = trackRefs.current.get(row.key);
                        if (draggable && track) startDrag(event, block, "move", track);
                      }}
                      onPointerUp={() => (draggable ? endDrag(block) : undefined)}
                      onClick={() => {
                        if (movedRef.current) {
                          movedRef.current = false;
                          return;
                        }
                        if (!draft) onOpenBlock(block);
                      }}
                      title={
                        conflict
                          ? d.planner.doubleBooked
                          : `${toHHMM(start)}–${toHHMM(end % 1440)}${block.title ? ` · ${block.title}` : ""}`
                      }
                    >
                      {draggable ? (
                        <span
                          role="presentation"
                          onPointerDown={(event) => {
                            const track = trackRefs.current.get(row.key);
                            if (track) startDrag(event, block, "start", track);
                          }}
                          onPointerUp={() => endDrag(block)}
                          className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md"
                        />
                      ) : null}
                      <span className="truncate">
                        {toHHMM(start)}–{toHHMM(end % 1440)}
                        {overnight ? ` ${d.planner.pastMidnight}` : ""}
                        {block.title ? ` · ${block.title}` : ""}
                      </span>
                      {draggable ? (
                        <span
                          role="presentation"
                          onPointerDown={(event) => {
                            const track = trackRefs.current.get(row.key);
                            if (track) startDrag(event, block, "end", track);
                          }}
                          onPointerUp={() => endDrag(block)}
                          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md"
                        />
                      ) : null}
                    </div>
                  );
                })}

              </div>
            </div>
            );
          })}

          {/* Coverage: how many people are on, half hour by half hour */}
          <div className="flex border-t border-border bg-muted/20">
            <div className="w-48 shrink-0 border-r border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground">
              {d.planner.coverage}
            </div>
            <div className="relative flex h-10 flex-1 items-end gap-px px-px py-1">
              {coverage.map((count, index) => (
                <span
                  key={index}
                  className={cn("flex-1 rounded-sm", count > 0 ? "bg-foreground/70" : "bg-border/40")}
                  style={{ height: count > 0 ? `${(count / peak) * 100}%` : "3px" }}
                  title={String(count)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">{d.planner.dragHint}</p>
    </div>
  );
}
