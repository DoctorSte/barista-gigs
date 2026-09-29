"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, X } from "lucide-react";
import { toast } from "sonner";
import { cancelStaffShift, markTimeOff, removeTimeOff } from "@/app/actions/staff";
import { useDict, useLocaleTag } from "@/components/i18n-provider";
import { fromDateKey, dateKey, hoursLabel, toHHMM } from "@/lib/planner";
import { Section } from "@/components/ui/section";

export type ScheduleCafe = {
  staffId: string;
  cafeName: string;
  weeklyHoursTarget: number | null;
  weekMinutes: number;
  upcoming: { id: string; date: string; startMin: number; endMin: number; note: string | null }[];
  timeOff: { id: string; date: string; note: string | null }[];
};

export function MySchedule({ cafes }: { cafes: ScheduleCafe[] }) {
  return (
    <div className="flex flex-col">
      {cafes.map((cafe) => (
        <CafeSchedule key={cafe.staffId} cafe={cafe} />
      ))}
    </div>
  );
}

function CafeSchedule({ cafe }: { cafe: ScheduleCafe }) {
  const d = useDict();
  const loc = useLocaleTag();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [cancelling, setCancelling] = useState<ScheduleCafe["upcoming"][number] | null>(null);
  const [reason, setReason] = useState("");

  const dayLabel = (key: string) =>
    fromDateKey(key).toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short" });

  function submitOff(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return;
    startTransition(async () => {
      const result = await markTimeOff({ staffId: cafe.staffId, date, note });
      if (result.ok) {
        toast.success(d.schedule.marked);
        setDate("");
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Section
      title={cafe.cafeName}
      aside={
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {d.schedule.hoursThisWeek(hoursLabel(cafe.weekMinutes))}
          </span>
          {cafe.weeklyHoursTarget != null ? d.schedule.ofContracted(cafe.weeklyHoursTarget) : ""}
        </p>
      }
    >
      <div>
        <p className="text-[13px] font-medium">{d.schedule.upcoming}</p>
        {cafe.upcoming.length === 0 ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{d.schedule.noShifts}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {cafe.upcoming.map((shift) => (
              <li
                key={shift.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2 text-sm"
              >
                <span className="font-medium">{dayLabel(shift.date)}</span>
                <span className="flex items-center gap-2.5 tabular-nums text-muted-foreground">
                  {toHHMM(shift.startMin)}–{toHHMM(shift.endMin % 1440)}
                  {shift.note ? ` · ${shift.note}` : ""}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setReason("");
                      setCancelling(shift);
                    }}
                    className="pressable rounded-sm text-[12px] font-medium text-muted-foreground/70 underline-offset-2 outline-none hover:text-danger hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {d.schedule.cantMakeIt}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <CalendarOff className="size-3.5" /> {d.schedule.timeOff}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{d.schedule.timeOffHint}</p>

        {cafe.timeOff.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {cafe.timeOff.map((off) => (
              <li
                key={off.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-[13px]"
                title={off.note ?? undefined}
              >
                {dayLabel(off.date)}
                {off.note ? (
                  <span className="max-w-40 truncate text-muted-foreground">· {off.note}</span>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  aria-label={d.common.remove}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeTimeOff(off.id);
                      if (result.ok) {
                        toast.success(d.schedule.removedOff);
                        router.refresh();
                      } else {
                        toast.error(result.error);
                      }
                    })
                  }
                  className="pressable rounded-full p-0.5 text-muted-foreground/60 hover:text-danger"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={submitOff} className="mt-3 flex flex-wrap gap-2">
          <input
            type="date"
            required
            value={date}
            min={dateKey(new Date())}
            onChange={(event) => setDate(event.target.value)}
            aria-label={d.schedule.date}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={note}
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
            placeholder={d.schedule.notePlaceholder}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={pending || !date}
            className="pressable inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {d.schedule.markOff}
          </button>
        </form>
      </div>

      {cancelling ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setCancelling(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={d.schedule.cancelTitle}
            className="menu-panel w-full max-w-sm rounded-lg border border-border bg-surface-raised p-5 shadow-xl shadow-black/10"
            style={{ "--origin": "center" } as React.CSSProperties}
          >
            <h2 className="font-display text-lg font-semibold">{d.schedule.cancelTitle}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {d.schedule.cancelBody(
                cafe.cafeName,
                `${dayLabel(cancelling.date)}, ${toHHMM(cancelling.startMin)}–${toHHMM(cancelling.endMin % 1440)}`,
              )}
            </p>
            <textarea
              value={reason}
              maxLength={300}
              rows={2}
              onChange={(event) => setReason(event.target.value)}
              placeholder={d.schedule.cancelReasonPlaceholder}
              className="mt-4 w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setCancelling(null)}
                className="pressable inline-flex h-9 items-center rounded-md px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {d.schedule.keepShift}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await cancelStaffShift({
                      plannerShiftId: cancelling.id,
                      reason,
                    });
                    if (result.ok) {
                      toast.success(d.schedule.cancelled);
                      setCancelling(null);
                      router.refresh();
                    } else {
                      toast.error(result.error);
                    }
                  })
                }
                className="pressable inline-flex h-9 items-center rounded-md bg-danger px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {d.schedule.confirmCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
