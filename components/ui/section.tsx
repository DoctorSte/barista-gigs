import { cn } from "@/lib/utils";

/**
 * A page section with a label rail instead of a box: hairline rules and
 * whitespace do the separating, and the title speaks in the passport's
 * voice — a small tracked capital label — so the content stays the loudest
 * thing on the page. Sections stack directly; each draws its own top rule
 * except the first.
 */
export function Section({
  title,
  hint,
  aside,
  children,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  /** Rendered in the rail under the hint: status chips, quiet actions. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-x-12 gap-y-4 border-t border-border/70 py-9",
        "md:grid-cols-[200px_minmax(0,1fr)]",
        className,
      )}
    >
      <header className="flex min-w-0 flex-col items-start gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em]">{title}</h2>
        {hint ? (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{hint}</p>
        ) : null}
        {aside}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Wraps a run of Sections; exists so pages read declaratively. */
export function SectionStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}
