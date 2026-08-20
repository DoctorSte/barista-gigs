"use client";

import { cn } from "@/lib/utils";

export function ChipGroup({
  options,
  selected,
  onToggle,
  name,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  /** When set, renders hidden inputs so the selection submits with a form. */
  name?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.value)}
            className={cn(
              "pressable rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
      {name
        ? selected.map((value) => <input key={value} type="hidden" name={name} value={value} />)
        : null}
    </div>
  );
}
