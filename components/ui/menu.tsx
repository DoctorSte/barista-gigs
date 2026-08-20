"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const MenuContext = createContext<{ close: () => void }>({ close: () => {} });

/**
 * Minimal dropdown. Scales in from its trigger corner (origin-aware),
 * closes on outside click / Escape, no animation on close-by-navigation.
 */
export function Menu({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pressable flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {trigger(open)}
      </button>
      {open ? (
        <MenuContext.Provider value={{ close }}>
          <div
            role="menu"
            style={{ "--origin": align === "end" ? "top right" : "top left" } as React.CSSProperties}
            className={cn(
              "menu-panel absolute z-50 mt-2 min-w-52 rounded-md border border-border bg-surface-raised p-1.5 shadow-lg shadow-black/8",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </div>
        </MenuContext.Provider>
      ) : null}
    </div>
  );
}

export function MenuItem({
  onSelect,
  children,
  destructive,
}: {
  onSelect?: () => void;
  children: ReactNode;
  destructive?: boolean;
}) {
  const { close } = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onSelect?.();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm outline-none",
        "transition-colors duration-100 hover:bg-muted focus-visible:bg-muted",
        destructive ? "text-danger" : "text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1.5 h-px bg-border" role="separator" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-xs text-muted-foreground">{children}</div>;
}
