"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createGig, updateGig } from "@/app/actions/gigs";
import { createPlannerShift, deletePlannerShift, updatePlannerShift } from "@/app/actions/planner";
import { defaultCellTimes, fromDateKey, toMinutes } from "@/lib/planner";
import { GigStatusBadge } from "@/components/ui/badge";
import { GigStatusControl } from "@/components/gig-status-control";
import { SubmitButton, Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { useDict, useLocaleTag } from "@/components/i18n-provider";
import type { PlannerBarista, PlannerBlock } from "@/components/planner-grid";
import type { OpeningHours } from "@/lib/database.types";

export type EditorState =
  | { type: "create-gig"; date: string; barista?: PlannerBarista }
  | { type: "create-internal"; date: string; staff: { id: string; name: string } }
  | { type: "detail-gig"; block: PlannerBlock }
  | { type: "detail-internal"; block: PlannerBlock };

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="menu-panel w-full max-w-sm rounded-lg border border-border bg-surface-raised p-5 shadow-xl shadow-black/10"
        style={{ "--origin": "center" } as React.CSSProperties}
      >
        <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function weekdayIdx(date: string): number {
  return (fromDateKey(date).getDay() + 6) % 7;
}

/** Creates a marketplace gig from a planner cell; optionally invites a barista. */
function CreateGigEditor({
  date,
  barista,
  shopName,
  openingHours,
  subscribed,
  onClose,
}: {
  date: string;
  barista?: PlannerBarista;
  shopName: string;
  openingHours: OpeningHours | null;
  subscribed: boolean;
  onClose: () => void;
}) {
  const d = useDict();
  const loc = useLocaleTag();
  const defaults = defaultCellTimes(openingHours, weekdayIdx(date));
  const [state, action] = useActionState(createGig, null);
  const title = barista ? d.planner.newGigFor(barista.name) : d.planner.newGig;
  const dateLabel = fromDateKey(date).toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Dialog title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">{dateLabel}</p>
      {!subscribed ? (
        <div>
          <p className="text-sm text-muted-foreground">{d.planner.subscribeToPost}</p>
          <Link
            href="/settings/billing"
            className="pressable mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            {d.cafe.setUpBilling}
          </Link>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3.5">
          <input type="hidden" name="kind" value="shift" />
          <input type="hidden" name="payType" value="hourly" />
          <input type="hidden" name="shiftDate" value={date} />
          {barista ? <input type="hidden" name="inviteExtraId" value={barista.extraId} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.planner.start}>
              {(id) => (
                <Input id={id} name="shiftStart" type="time" step={1800} defaultValue={defaults.start} required />
              )}
            </Field>
            <Field label={d.planner.end}>
              {(id) => (
                <Input id={id} name="shiftEnd" type="time" step={1800} defaultValue={defaults.end} required />
              )}
            </Field>
          </div>
          <Field label={d.planner.payPerHour}>
            {(id) => (
              <Input
                id={id}
                name="payRate"
                type="number"
                min={1}
                step={0.5}
                defaultValue={barista?.hourlyRateCents ? barista.hourlyRateCents / 100 : 20}
                required
              />
            )}
          </Field>
          <Field label={d.planner.titleOptional}>
            {(id) => <Input id={id} name="title" maxLength={120} />}
          </Field>
          <Field label={d.gigForm.description}>
            {(id) => (
              <Textarea
                id={id}
                name="description"
                rows={2}
                required
                minLength={10}
                maxLength={2000}
                defaultValue={d.planner.defaultDescription(shopName)}
              />
            )}
          </Field>
          {barista ? (
            <p className="text-[13px] text-muted-foreground">{d.planner.invitedHint}</p>
          ) : null}
          <FormError message={state && !state.ok ? state.error : undefined} />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {d.common.cancel}
            </Button>
            <SubmitButton size="sm">{d.planner.createGig}</SubmitButton>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/** Create or edit an internal staff shift. */
function InternalEditor({
  mode,
  date,
  staffName,
  block,
  openingHours,
  onClose,
}: {
  mode: "create" | "edit";
  date: string;
  staffName: string;
  block?: PlannerBlock;
  openingHours: OpeningHours | null;
  onClose: () => void;
}) {
  const d = useDict();
  const loc = useLocaleTag();
  const router = useRouter();
  const defaults = defaultCellTimes(openingHours, weekdayIdx(date));
  const [start, setStart] = useState(block?.start || defaults.start);
  const [end, setEnd] = useState(block?.end || defaults.end);
  const [note, setNote] = useState(block?.note ?? "");
  const [pending, startTransition] = useTransition();
  const dateLabel = fromDateKey(date).toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function toEndMin(value: string): number {
    const minutes = toMinutes(value);
    return minutes === 0 ? 1440 : minutes;
  }

  function save() {
    startTransition(async () => {
      const payload = { startMin: toMinutes(start), endMin: toEndMin(end), note };
      const result =
        mode === "create"
          ? await createPlannerShift({ staffId: block?.staffId ?? "", date, ...payload })
          : await updatePlannerShift({ id: block?.plannerShiftId ?? "", ...payload });
      if (result.ok) {
        toast.success(d.planner.shiftSaved);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    if (!block?.plannerShiftId) return;
    startTransition(async () => {
      const result = await deletePlannerShift(block.plannerShiftId!);
      if (result.ok) {
        toast.success(d.planner.shiftDeleted);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog title={d.planner.newInternal(staffName)} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        {dateLabel} · {d.planner.internalShift}
      </p>
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label={d.planner.start}>
            {(id) => (
              <Input id={id} type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} />
            )}
          </Field>
          <Field label={d.planner.end}>
            {(id) => (
              <Input id={id} type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)} />
            )}
          </Field>
        </div>
        <Field label={d.planner.note}>
          {(id) => (
            <Input id={id} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
        <div className="flex items-center justify-between gap-2">
          {mode === "edit" ? (
            <Button variant="ghost" size="sm" loading={pending} onClick={remove} className="text-danger">
              <Trash2 className="size-4" /> {d.planner.deleteShift}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {d.common.cancel}
            </Button>
            <Button size="sm" loading={pending} onClick={save}>
              {mode === "create" ? d.planner.createInternal : d.planner.saveShift}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/** Details + quick actions for a gig shift chip. */
function GigDetailEditor({ block, onClose }: { block: PlannerBlock; onClose: () => void }) {
  const d = useDict();
  const loc = useLocaleTag();
  const router = useRouter();
  const [state, action] = useActionState(updateGig, null);
  const [editing, setEditing] = useState(false);
  const dateLabel = fromDateKey(block.date).toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success(d.planner.shiftSaved);
      onClose();
      router.refresh();
    }
  }, [state, d, onClose, router]);

  const singleShift = (block.shiftCount ?? 1) === 1;

  return (
    <Dialog title={block.title || d.planner.title} onClose={onClose}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {block.status ? <GigStatusBadge status={block.status} /> : null}
        {block.isSos ? <span className="text-[12px] font-semibold text-danger">SOS</span> : null}
        {(block.pendingApplicants ?? 0) > 0 ? (
          <span className="text-[13px] text-muted-foreground">
            {d.planner.applicants(block.pendingApplicants!)}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {dateLabel} · {block.start}–{block.end}
      </p>

      {editing && singleShift ? (
        <form action={action} className="mt-4 flex flex-col gap-3.5">
          <input type="hidden" name="gigId" value={block.gigId} />
          <input type="hidden" name="kind" value="shift" />
          <input type="hidden" name="title" value={block.title} />
          <input type="hidden" name="description" value={block.description ?? ""} />
          <input type="hidden" name="payRate" value={(block.payRateCents ?? 0) / 100} />
          <input type="hidden" name="payType" value={block.payType ?? "hourly"} />
          <input type="hidden" name="isSos" value={String(block.isSos ?? false)} />
          <input type="hidden" name="status" value={block.status ?? "open"} />
          {(block.requiredSkills ?? []).map((skill) => (
            <input key={skill} type="hidden" name="requiredSkills" value={skill} />
          ))}
          <input type="hidden" name="shiftDate" value={block.date} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.planner.start}>
              {(id) => (
                <Input id={id} name="shiftStart" type="time" step={1800} defaultValue={block.start} required />
              )}
            </Field>
            <Field label={d.planner.end}>
              {(id) => (
                <Input id={id} name="shiftEnd" type="time" step={1800} defaultValue={block.end} required />
              )}
            </Field>
          </div>
          <FormError message={state && !state.ok ? state.error : undefined} />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              {d.common.cancel}
            </Button>
            <SubmitButton size="sm">{d.planner.saveShift}</SubmitButton>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {!singleShift ? (
            <p className="text-[13px] text-muted-foreground">{d.planner.editOnGigPage}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {block.gigId && block.status ? (
              <GigStatusControl gigId={block.gigId} status={block.status} />
            ) : null}
            {singleShift ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                {d.cafe.editGig}
              </Button>
            ) : null}
          </div>
          <Link
            href={`/cafe/gigs/${block.gigId}`}
            className="pressable inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ExternalLink className="size-4" /> {d.planner.viewGig}
          </Link>
        </div>
      )}
    </Dialog>
  );
}

export function PlannerEditor({
  editor,
  onClose,
  subscribed,
  shopName,
  openingHours,
  staff,
}: {
  editor: EditorState | null;
  onClose: () => void;
  subscribed: boolean;
  shopName: string;
  openingHours: OpeningHours | null;
  staff: { id: string; name: string }[];
}) {
  if (!editor) return null;

  if (editor.type === "create-gig") {
    return (
      <CreateGigEditor
        date={editor.date}
        barista={editor.barista}
        shopName={shopName}
        openingHours={openingHours}
        subscribed={subscribed}
        onClose={onClose}
      />
    );
  }
  if (editor.type === "create-internal") {
    return (
      <InternalEditor
        mode="create"
        date={editor.date}
        staffName={editor.staff.name}
        block={{ id: "", kind: "internal", date: editor.date, start: "", end: "", title: "", staffId: editor.staff.id } as PlannerBlock}
        openingHours={openingHours}
        onClose={onClose}
      />
    );
  }
  if (editor.type === "detail-internal") {
    const staffName = staff.find((s) => s.id === editor.block.staffId)?.name ?? "";
    return (
      <InternalEditor
        mode="edit"
        date={editor.block.date}
        staffName={staffName}
        block={editor.block}
        openingHours={openingHours}
        onClose={onClose}
      />
    );
  }
  return <GigDetailEditor block={editor.block} onClose={onClose} />;
}
