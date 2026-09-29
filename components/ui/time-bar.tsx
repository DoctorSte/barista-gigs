"use client";

import { cn } from "@/lib/utils";

/**
 * A shift bar on a time axis — the planner's visual vocabulary, shared by the
 * day view and the week-hours editor. A rounded pill with the time centered
 * and, when draggable, slim grips on both edges: drag the body to move, an
 * edge to resize. Positioning (left/width/top) comes in via style; color
 * variants via className.
 */
export function TimeBar({
  children,
  className,
  style,
  title,
  draggable = false,
  onDragStart,
  onDragEnd,
  onClick,
  onNudge,
  startAria,
  endAria,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  draggable?: boolean;
  /** Pointer went down on the body ("move") or an edge ("start" | "end"). */
  onDragStart?: (mode: "move" | "start" | "end", event: React.PointerEvent) => void;
  onDragEnd?: (mode: "move" | "start" | "end", event: React.PointerEvent) => void;
  onClick?: () => void;
  /** Keyboard: arrow keys on an edge grip shift that edge by one step. */
  onNudge?: (edge: "start" | "end", direction: -1 | 1) => void;
  startAria?: string;
  endAria?: string;
}) {
  function edge(side: "start" | "end", aria?: string) {
    return (
      <button
        type="button"
        aria-label={aria}
        tabIndex={onNudge ? 0 : -1}
        onPointerDown={(event) => {
          event.stopPropagation();
          onDragStart?.(side, event);
        }}
        onPointerUp={(event) => onDragEnd?.(side, event)}
        onKeyDown={(event) => {
          if (!onNudge) return;
          if (event.key === "ArrowLeft") onNudge(side, -1);
          if (event.key === "ArrowRight") onNudge(side, 1);
        }}
        className={cn(
          "absolute inset-y-0 w-2.5 cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-ring",
          side === "start" ? "left-0 rounded-l-md" : "right-0 rounded-r-md",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-current opacity-40",
            side === "start" ? "left-1" : "right-1",
          )}
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center rounded-md text-[11px] font-medium tabular-nums shadow-sm",
        draggable ? "cursor-grab touch-none active:cursor-grabbing" : onClick && "cursor-pointer",
        className,
      )}
      style={style}
      title={title}
      onPointerDown={draggable ? (event) => onDragStart?.("move", event) : undefined}
      onPointerUp={draggable ? (event) => onDragEnd?.("move", event) : undefined}
      onClick={onClick}
    >
      {draggable ? edge("start", startAria) : null}
      <span className="pointer-events-none truncate px-2.5">{children}</span>
      {draggable ? edge("end", endAria) : null}
    </div>
  );
}
