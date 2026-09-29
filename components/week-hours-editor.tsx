"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import type { AvailabilityWindow, OpeningHours } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { TimeBar } from "@/components/ui/time-bar";
import { useDict } from "@/components/i18n-provider";

const SNAP = 30; // minutes
const MIN_DURATION = 60;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toHHMM(minutes: number): string {
  const clamped = Math.min(Math.max(minutes, 0), 1439);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snap(minutes: number) {
  return Math.round(minutes / SNAP) * SNAP;
}

/**
 * One row per weekday; toggle the day, then drag the bar's edges (or the bar
 * itself) to set hours. `bounds` (e.g. café opening hours) limits each row's
 * track; a null bound disables the row entirely.
 */
export function WeekHoursEditor({
  windows,
  onChange,
  bounds,
  defaultStart = "08:00",
  defaultEnd = "16:00",
}: {
  windows: AvailabilityWindow[];
  onChange: (windows: AvailabilityWindow[]) => void;
  bounds?: OpeningHours | null;
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const d = useDict();
  const dragState = useRef<{
    day: number;
    mode: "start" | "end" | "move";
    trackRect: DOMRect;
    grabOffset: number;
  } | null>(null);

  function boundsFor(day: number): { min: number; max: number } | null {
    if (!bounds) return { min: 0, max: 1439 };
    const b = bounds[day];
    if (!b) return null;
    return { min: toMinutes(b.open), max: toMinutes(b.close) };
  }

  function windowFor(day: number) {
    return windows.find((w) => w.day === day);
  }

  function setWindow(day: number, start: number, end: number) {
    const next = windows
      .filter((w) => w.day !== day)
      .concat({ day, start: toHHMM(start), end: toHHMM(end) })
      .sort((a, b) => a.day - b.day);
    onChange(next);
  }

  function toggleDay(day: number) {
    const existing = windowFor(day);
    if (existing) {
      onChange(windows.filter((w) => w.day !== day));
      return;
    }
    const b = boundsFor(day);
    if (!b) return;
    const start = Math.max(toMinutes(defaultStart), b.min);
    const end = Math.min(Math.max(toMinutes(defaultEnd), start + MIN_DURATION), b.max);
    setWindow(day, start, Math.max(end, Math.min(start + MIN_DURATION, b.max)));
  }

  function minutesFromPointer(clientX: number, rect: DOMRect, b: { min: number; max: number }) {
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return snap(b.min + ratio * (b.max - b.min));
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag) return;
    const b = boundsFor(drag.day);
    const w = windowFor(drag.day);
    if (!b || !w) return;
    const start = toMinutes(w.start);
    const end = toMinutes(w.end);
    const pointer = minutesFromPointer(event.clientX, drag.trackRect, b);

    if (drag.mode === "start") {
      setWindow(drag.day, Math.min(Math.max(pointer, b.min), end - MIN_DURATION), end);
    } else if (drag.mode === "end") {
      setWindow(drag.day, start, Math.max(Math.min(pointer, b.max), start + MIN_DURATION));
    } else {
      const duration = end - start;
      let nextStart = snap(pointer - drag.grabOffset);
      nextStart = Math.min(Math.max(nextStart, b.min), b.max - duration);
      setWindow(drag.day, nextStart, nextStart + duration);
    }
  }

  function startDrag(
    event: React.PointerEvent,
    day: number,
    mode: "start" | "end" | "move",
    trackEl: HTMLElement,
  ) {
    const b = boundsFor(day);
    const w = windowFor(day);
    if (!b || !w) return;
    const rect = trackEl.getBoundingClientRect();
    const pointer = minutesFromPointer(event.clientX, rect, b);
    dragState.current = {
      day,
      mode,
      trackRect: rect,
      grabOffset: mode === "move" ? pointer - toMinutes(w.start) : 0,
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function nudge(day: number, edge: "start" | "end", delta: number) {
    const b = boundsFor(day);
    const w = windowFor(day);
    if (!b || !w) return;
    const start = toMinutes(w.start);
    const end = toMinutes(w.end);
    if (edge === "start") {
      setWindow(day, Math.min(Math.max(start + delta, b.min), end - MIN_DURATION), end);
    } else {
      setWindow(day, start, Math.max(Math.min(end + delta, b.max), start + MIN_DURATION));
    }
  }

  return (
    <div className="flex flex-col gap-1.5" onPointerMove={onPointerMove} onPointerUp={() => (dragState.current = null)}>
      {d.labels.weekdays.map((label, day) => {
        const b = boundsFor(day);
        const w = windowFor(day);
        const active = Boolean(w && b);
        const start = w ? toMinutes(w.start) : 0;
        const end = w ? toMinutes(w.end) : 0;
        const left = b ? ((start - b.min) / (b.max - b.min)) * 100 : 0;
        const width = b ? ((end - start) / (b.max - b.min)) * 100 : 0;

        return (
          <div key={label} className="flex items-center gap-2.5">
            <button
              type="button"
              aria-pressed={active}
              disabled={!b}
              onClick={() => toggleDay(day)}
              className={cn(
                "pressable w-11 shrink-0 rounded-sm py-1.5 text-center text-[13px] font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                !b
                  ? "cursor-not-allowed text-muted-foreground/40 line-through"
                  : active
                    ? "bg-accent-soft text-accent"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>

            <div
              data-track
              className={cn(
                "relative h-9 flex-1 rounded-md border border-border",
                b ? "bg-muted/60" : "bg-muted/25",
              )}
            >
              {active && b ? (
                <TimeBar
                  draggable
                  className="inset-y-1 border border-primary bg-primary text-primary-foreground"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onDragStart={(mode, e) => {
                    const track = (e.currentTarget as HTMLElement).closest(
                      "[data-track]",
                    ) as HTMLElement | null;
                    if (track) startDrag(e, day, mode, track);
                  }}
                  onNudge={(edge, direction) => nudge(day, edge, direction * SNAP)}
                  startAria={`${label} start time, ${w!.start}`}
                  endAria={`${label} end time, ${w!.end}`}
                >
                  {width > 22 ? `${w!.start} – ${w!.end}` : ""}
                </TimeBar>
              ) : (
                <button
                  type="button"
                  disabled={!b}
                  onClick={() => toggleDay(day)}
                  aria-label={b ? `Add hours on ${label}` : `${label} unavailable`}
                  className="absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {!b ? (
                    <span className="text-[11px] text-muted-foreground/50">Closed</span>
                  ) : null}
                </button>
              )}
            </div>

            <span className="flex w-28 shrink-0 items-center justify-end gap-1 text-right text-[12px] tabular-nums text-muted-foreground">
              {active ? `${w!.start} – ${w!.end}` : b ? "—" : "closed"}
              {active ? (
                <button
                  type="button"
                  aria-label={`${d.common.remove} — ${label}`}
                  onClick={() => toggleDay(day)}
                  className="pressable rounded-full p-1 text-muted-foreground/50 outline-none hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <span aria-hidden className="size-[22px]" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
