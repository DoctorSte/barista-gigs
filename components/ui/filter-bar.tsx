"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Compact filter row shared by the gig and barista browsers: pill-shaped
 * controls that wrap, a result count, and a clear-all affordance.
 */
export function FilterBar({
  label,
  clearLabel,
  resultLabel,
  activeCount,
  onClear,
  children,
}: {
  label: string;
  clearLabel: string;
  resultLabel: string;
  activeCount: number;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          {label}
        </span>
        {children}
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="pressable inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
            {clearLabel}
          </button>
        ) : null}
        <span className="ml-auto text-[13px] text-muted-foreground">{resultLabel}</span>
      </div>
    </div>
  );
}

/** A labelled pill wrapping a bare control (select/input). */
export function FilterPill({
  label,
  active,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150",
        active
          ? "border-foreground/35 bg-muted text-foreground"
          : "border-border bg-surface text-muted-foreground",
        className,
      )}
    >
      <span className="shrink-0">{label}</span>
      {children}
    </span>
  );
}

const BARE =
  "min-w-0 bg-transparent text-[13px] font-medium text-foreground outline-none focus-visible:underline";

export function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(BARE, "-mr-1 cursor-pointer py-0 pr-4")}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FilterInput({
  value,
  onChange,
  ariaLabel,
  type = "text",
  width = "w-14",
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  type?: string;
  width?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <input
      {...rest}
      type={type}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(BARE, width)}
    />
  );
}

/** Boolean pill toggle, e.g. "Has CV". */
export function FilterToggle({
  label,
  active,
  onToggle,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        "pressable inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </button>
  );
}
